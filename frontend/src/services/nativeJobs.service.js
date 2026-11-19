const BASE = '/api/native_jobs';
export const PHYSICS_ID = 'watertap.flowsheets.airtap_harvester.airtap_ui';
export const SURROGATE_ID = 'watertap.flowsheets.airtap_surrogate.airtap_ui';
export const NATIVE_IDS = [PHYSICS_ID, SURROGATE_ID];
export const NATIVE_ID = PHYSICS_ID;
export const isNativeFlowsheet = id => NATIVE_IDS.includes(id);
export const nativeEntryFromLocation = () => NATIVE_IDS.find(id => decodeURIComponent(window.location.hash).includes(id)) || null;

export async function jobRequest(url, options) {
    let response = await fetch(url, options);
    if (!response.ok) {
        const data = await response.clone().json().catch(() => ({}));
        throw new Error(data.detail || ('HTTP ' + response.status));
    }
    if (response.status !== 202) return response;
    const job = await response.json();
    window.dispatchEvent(new Event('airtap-job-change'));
    while (true) {
        const check = await fetch(BASE + '/' + job.id);
        if (!check.ok) throw new Error('Unable to read calculation status');
        const state = await check.json();
        if (state.status === 'succeeded') return fetch(BASE + '/' + job.id + '/result');
        if (state.status === 'failed' || state.status === 'cancelled') {
            throw new Error(state.error || 'Calculation ended');
        }
        await new Promise(resolve => setTimeout(resolve, 900));
    }
}

export async function downloadNativeResults(id) {
    const response = await fetch('/api/flowsheets/' + id + '/results.xlsx');
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || 'Results are not available. Build and run the flowsheet first.');
    }
    if (!(response.headers.get('content-type') || '').includes('spreadsheetml.sheet')) throw new Error('The server did not return a valid results workbook.');
    const url = window.URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href=url; link.download='AirTAP_Results.xlsx';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}
