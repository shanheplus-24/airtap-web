const BASE = '/api/native_jobs';
export const NATIVE_ID = 'watertap.flowsheets.airtap.airtap_ui';

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
        if (!check.ok) throw new Error('无法读取计算任务状态');
        const state = await check.json();
        if (state.status === 'succeeded') return fetch(BASE + '/' + job.id + '/result');
        if (state.status === 'failed' || state.status === 'cancelled') {
            throw new Error(state.error || '计算已结束');
        }
        await new Promise(resolve => setTimeout(resolve, 900));
    }
}
