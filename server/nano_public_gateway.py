"""Authenticated AirTAP_New gateway with access to prior accepted job records."""
import hashlib
import hmac
import os
from pathlib import Path
import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response


def create_app():
    digest = Path(os.environ['AIRTAP_ACCESS_DIGEST_FILE']).read_text().strip()
    primary = os.environ.get('AIRTAP_PRIVATE_ORIGIN', 'http://127.0.0.1:8091').rstrip('/')
    legacy = os.environ.get('AIRTAP_LEGACY_ORIGIN', 'http://127.0.0.1:8088').rstrip('/')
    app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
    app.add_middleware(CORSMiddleware, allow_origins=['https://shanheplus-24.github.io'],
                       allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
                       allow_headers=['Authorization', 'Content-Type'],
                       expose_headers=['Content-Disposition'])

    @app.api_route('/{path:path}', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
    async def proxy(path: str, request: Request):
        header = request.headers.get('authorization', '')
        token = header[7:] if header.startswith('Bearer ') else ''
        if not token or not hmac.compare_digest(hashlib.sha256(token.encode()).hexdigest(), digest):
            return JSONResponse({'detail': 'Authentication required'}, status_code=401)
        if not (path == 'api' or path.startswith('api/') or path == 'health'):
            return JSONResponse({'detail': 'Not found'}, status_code=404)
        body = await request.body()
        if len(body) > 16 * 1024**2:
            return JSONResponse({'detail': 'Request too large'}, status_code=413)
        headers = {k: v for k, v in request.headers.items()
                   if k.lower() not in {'host', 'authorization', 'origin', 'connection', 'content-length'}}
        suffix = '/' + path + ('?' + request.url.query if request.url.query else '')
        origin = legacy if path.startswith('api/flowsheets/watertap.flowsheets.airtap.airtap_ui/') else primary
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(90, connect=5)) as client:
                upstream = await client.request(request.method, origin + suffix, headers=headers, content=body)
                if upstream.status_code == 404 and path.startswith('api/native_jobs/') and request.method == 'GET':
                    upstream = await client.request(request.method, legacy + suffix, headers=headers, content=body)
        except httpx.HTTPError:
            return JSONResponse({'detail': 'Computation service unavailable'}, status_code=503)
        omitted = {'content-length', 'content-encoding', 'transfer-encoding', 'connection'}
        response_headers = {k: v for k, v in upstream.headers.items()
                            if k.lower() not in omitted and not k.lower().startswith('access-control-')}
        return Response(upstream.content, status_code=upstream.status_code, headers=response_headers)

    return app
