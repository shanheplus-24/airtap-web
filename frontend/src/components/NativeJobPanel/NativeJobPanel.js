import {nativeEntryFromLocation} from '../../services/nativeJobs.service';
import React, {useEffect, useRef, useState} from 'react';
import {Alert, Box, Button, LinearProgress, Paper, Stack, Typography} from '@mui/material';

export default function NativeJobPanel() {
    const [job, setJob] = useState(null);
    const previous = useRef(null);
    const [entry, setEntry] = useState(nativeEntryFromLocation);
    useEffect(() => {const changed=()=>{previous.current=null;setEntry(nativeEntryFromLocation());};window.addEventListener('hashchange',changed);return()=>window.removeEventListener('hashchange',changed);}, []);
    const [hiddenId,setHiddenId] = useState(null);
    useEffect(() => {
        let live = true;
        const poll = async () => {
            try {
                const response = await fetch('/api/native_jobs/current'+(entry?'?flowsheet_id='+encodeURIComponent(entry):''));
                if (!response.ok) return;
                const data = await response.json();
                if (!live) return;
                if (!previous.current && data && !['queued','running'].includes(data.status)) setHiddenId(data.id);
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
    }, [entry]);
    if (!job || (hiddenId === job.id && !['queued','running'].includes(job.status))) return null;
    const busy = ['queued', 'running'].includes(job.status);
    const climateRejected = job.status === 'failed' && job.error_code === 'climate_scope';
    const outsideModelDomain = job.status === 'failed' && job.error_code === 'model_domain';
    const progress = job.progress || {};
    const seconds = Math.round(job.elapsed_seconds || 0);
    const elapsed = Math.floor(seconds / 60) + ' min ' + (seconds % 60) + ' s';
    const title = {build: 'Build flowsheet', solve: 'Simulation / Optimization', update: 'Update inputs', sweep: 'Parameter sweep'}[job.action] || job.action;
    const completed = progress.completed_seconds || 0;
    const total = progress.total_seconds;
    const cancel = async () => {
        await fetch('/api/native_jobs/' + job.id + '/cancel', {method:'POST'});
        window.dispatchEvent(new Event('airtap-job-change'));
    };
    return <Paper id="native-job-panel" elevation={4} sx={{mx:3, my:2, p:2, textAlign:'left'}}>
        <Typography fontWeight="bold">AirTAP · {job.model || 'AirTAP'} · {title} · {busy ? 'Running' : job.problem?.title || (climateRejected ? 'Cannot calculate' : outsideModelDomain ? 'Outside model scope' : ({succeeded:'Completed',failed:'Failed',cancelled:'Cancelled'}[job.status]))}</Typography>
        <Typography variant="body2">{job.options?.['Start date'] || job.options?.Start} → {job.options?.['End date'] || job.options?.End} · Elapsed {elapsed}</Typography>
        {busy && <>
            <Typography variant="body2" sx={{mt:1}}>{progress.message || 'Starting calculation'}</Typography>
            {total > 0 && progress.scope !== 'native_nlp' && <Typography variant="body2">Simulation progress {(completed/86400).toFixed(1)} / {(total/86400).toFixed(1)} days</Typography>}
            {progress.scope === 'native_nlp' && total > 0 && <Typography variant="body2">Selected period {(total/86400).toFixed(1)} days; solving the complete-period NLP</Typography>}
            {progress.scope === 'search' && <Typography variant="body2">Candidates completed {progress.completed_candidates} / {progress.total_candidates}</Typography>}
            {progress.phase === 'initializing' && <Typography variant="body2">Initializing segment {progress.element_index} / {progress.element_total}</Typography>}
            <LinearProgress sx={{my:1}} variant={total > 0 && progress.scope !== 'native_nlp' ? 'determinate':'indeterminate'} value={total > 0 ? Math.min(100,100*completed/total):undefined}/>
        </>}
        {job.status === 'succeeded' && job.pending_full_run && <Alert severity="info" sx={{my:1}}>Flowsheet is ready. Click RUN to calculate the selected period.</Alert>}
        {job.status === 'failed' && <Alert severity={outsideModelDomain || ["climate_scope","property_domain","invalid_input","design_requirement"].includes(job.error_code) ? "warning" : "error"} sx={{my:1}}>{job.error}{job.problem?.action && <Typography variant="body2" sx={{mt:1}}>{job.problem.action}</Typography>}</Alert>}
        {job.status === 'cancelled' && <Typography variant="body2">Logs and completed checkpoints are retained. Update the dates and rebuild to run again.</Typography>}
        <Stack direction="row" spacing={1} sx={{mt:1}}>
            {busy && <Button variant="contained" color="error" onClick={cancel}>Cancel calculation</Button>}
            {!busy && <Button size="small" onClick={() => setHiddenId(job.id)}>Dismiss</Button>}
            <Button size="small" component="a" target="_blank" href={'/api/native_jobs/' + job.id + '/log'}>View calculation log</Button>
        </Stack>
    </Paper>;
}
