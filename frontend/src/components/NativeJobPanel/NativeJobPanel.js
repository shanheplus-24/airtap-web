import React, {useEffect, useRef, useState} from 'react';
import {Alert, Box, Button, LinearProgress, Paper, Stack, Typography} from '@mui/material';

export default function NativeJobPanel() {
    const [job, setJob] = useState(null);
    const previous = useRef(null);
    const [hiddenId,setHiddenId] = useState(null);
    useEffect(() => {
        let live = true;
        const poll = async () => {
            try {
                const response = await fetch('/api/native_jobs/current');
                if (!response.ok) return;
                const data = await response.json();
                if (!live) return;
                if (data && previous.current?.id === data.id &&
                    ['queued', 'running'].includes(previous.current?.status) &&
                    ['succeeded', 'failed', 'cancelled'].includes(data.status)) {
                    window.dispatchEvent(new CustomEvent('airtap-job-finished', {detail: data}));
                }
                previous.current = data;
                setJob(data);
                window.dispatchEvent(new CustomEvent('airtap-job-status', {detail:data}));
            } catch (_) { /* Startup/reconnection keeps the existing progress visible. */ }
        };
        poll();
        const timer = setInterval(poll, 1000);
        window.addEventListener('airtap-job-change', poll);
        return () => {live = false; clearInterval(timer); window.removeEventListener('airtap-job-change', poll);};
    }, []);
    if (!job || (hiddenId === job.id && !['queued','running'].includes(job.status))) return null;
    const busy = ['queued', 'running'].includes(job.status);
    const progress = job.progress || {};
    const seconds = Math.round(job.elapsed_seconds || 0);
    const elapsed = Math.floor(seconds / 60) + ' 分 ' + (seconds % 60) + ' 秒';
    const title = {build: '构建模型', solve: '仿真 / 优化', update: '更新输入', sweep: '参数扫描'}[job.action] || job.action;
    const completed = progress.completed_seconds || 0;
    const total = progress.total_seconds;
    const cancel = async () => {
        await fetch('/api/native_jobs/' + job.id + '/cancel', {method:'POST'});
        window.dispatchEvent(new Event('airtap-job-change'));
    };
    return <Paper id="native-job-panel" elevation={4} sx={{position:'fixed', right:20, bottom:16, width:560, maxWidth:'calc(100vw - 40px)', p:2, zIndex:1600, textAlign:'left'}}>
        <Typography fontWeight="bold">AirTAP · {job.options?.Model || 'Porous PDE'} · {title} · {busy ? '计算中' : ({succeeded:'已完成',failed:'未完成',cancelled:'已取消'}[job.status])}</Typography>
        <Typography variant="body2">{job.options?.Start} → {job.options?.End} · 已用 {elapsed}</Typography>
        {busy && <>
            <Typography variant="body2" sx={{mt:1}}>{progress.message || '正在启动独立计算进程'}</Typography>
            {total > 0 && progress.scope !== 'clara' && <Typography variant="body2">完整仿真已完成 {(completed/86400).toFixed(1)} / {(total/86400).toFixed(1)} 天</Typography>}
            {progress.scope === 'clara' && total > 0 && <Typography variant="body2">所选完整时段 {(total/86400).toFixed(1)} 天；全时段 NLP 一起求解</Typography>}
            {progress.phase === 'initializing' && <Typography variant="body2">本段初始化 {progress.element_index} / {progress.element_total}</Typography>}
            <LinearProgress sx={{my:1}} variant={total > 0 && progress.scope !== 'clara' ? 'determinate':'indeterminate'} value={total > 0 ? Math.min(100,100*completed/total):undefined}/>
        </>}
        {job.status === 'succeeded' && job.pending_full_run && <Alert severity="info" sx={{my:1}}>模型已准备完成。点击 RUN 后计算完整日期范围。</Alert>}
        {job.status === 'failed' && <Alert severity="error" sx={{my:1}}>{job.error}</Alert>}
        {job.status === 'cancelled' && <Typography variant="body2">已保留日志及已有检查点；可修改日期后重新构建。</Typography>}
        <Stack direction="row" spacing={1} sx={{mt:1}}>
            {busy && <Button variant="contained" color="error" onClick={cancel}>取消计算</Button>}
            {!busy && <Button size="small" onClick={() => setHiddenId(job.id)}>收起</Button>}
            <Button size="small" component="a" target="_blank" href={'/api/native_jobs/' + job.id + '/log'}>查看计算日志</Button>
        </Stack>
    </Paper>;
}
