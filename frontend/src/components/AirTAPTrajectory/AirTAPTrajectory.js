import {downloadNativeResults} from '../../services/nativeJobs.service';
import React, {useEffect, useState} from 'react';
import Plot from 'react-plotly.js';
import {Alert, Box, Button, Typography} from '@mui/material';

export default function AirTAPTrajectory({id, result}) {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [downloadError, setDownloadError] = useState('');
    useEffect(() => {
        let active = true;
        fetch('/api/flowsheets/' + id + '/trajectory')
            .then(r => {if (!r.ok) throw Error('The complete period has not been calculated yet'); return r.json();})
            .then(d => {if (active) {setData(d); setError('');}})
            .catch(e => {if (active) setError(e.message);});
        return () => {active = false;};
    }, [id, result]);
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!data) return <Typography>Loading native trajectory…</Typography>;
    const rows = data.rows;
    const summary = data.summary;
    const location = summary.location;
    const comparison = data.comparison;
    const proxy = summary.model === 'GRU surrogate';
    const trace = [{x: rows.map(r => r.local_time), y: rows.map(r => r.uptake_kg_kg), name: proxy ? 'GRU uptake (raw)' : 'Device uptake', mode: 'lines', line: {color: '#226b92'}}];
    if (comparison) trace.push({x: comparison.rows.map(r => r.local_time), y: comparison.rows.map(r => r.uptake_display_kg_kg), name: 'GRU uptake ×0.9 (display)', mode: 'lines', line: {color: '#b96531', dash: 'dash'}});
    if (!proxy && !comparison) trace.push({x: rows.map(r => r.local_time), y: rows.map(r => r.collected_L), name: 'Collected water', yaxis: 'y2', mode: 'lines', line: {color: '#b96531'}});
    const baseLayout = {autosize:true,margin:{t:45,l:70,r:70,b:80},legend:{orientation:'h',y:1.18},hovermode:'x unified'};
    const daily = summary.daily || [];
    const otherDaily = comparison?.summary?.daily || [];
    const bar = records => records.map(r => r.collected_L ?? r.production_L);
    return <Box sx={{mt:4,width:'100%'}}>
        <Typography variant="h6">AirTAP Atmospheric Water Harvester Transient Results</Typography>
        <Typography variant="body2">Location: {location.latitude}, {location.longitude} ({location.timezone})</Typography>
        <Typography variant="body2">Time: {new Date(location.origin_utc).toLocaleString('en-GB',{timeZone:location.timezone,hourCycle:'h23'})} – {new Date(location.end_utc).toLocaleString('en-GB',{timeZone:location.timezone,hourCycle:'h23'})} (local time; end excluded)</Typography>
        <Typography variant="body2">Collection coefficient: {summary.collection_coefficient ?? (proxy ? 0.9 : 1)}.</Typography>
        {summary.economics?.LCOW_per_L === null && <Alert severity="info" sx={{mt:2}}>LCOW is undefined because the selected period produces no usable liquid water.</Alert>}
        <Plot useResizeHandler style={{width:'100%',height:430}} data={trace}
            layout={{...baseLayout,xaxis:{title:'Local time'},yaxis:{title:'Uptake (kg/kg dry)'},...(!proxy&&!comparison ? {yaxis2:{title:'Collected water (L)',overlaying:'y',side:'right'}} : {})}}
            config={{responsive:true,displaylogo:false}} />
        {daily.length>0 && <Plot useResizeHandler style={{width:'100%',height:350}}
            data={[{x:daily.map((r,i)=>r.local_start ? r.local_start.split('T')[0] : String(i+1)),y:bar(daily),name:proxy?'GRU collected water':'Device collected water',type:'bar',marker:{color:'#226b92'}},...(comparison ? [{x:otherDaily.map((_,i)=>i+1),y:bar(otherDaily),name:'GRU collected water (coefficient 0.9)',type:'bar',marker:{color:'#b96531'}}] : [])]}
            layout={{...baseLayout,barmode:'group',xaxis:{title:'Production day starting at 18:00 local time',type:'category'},yaxis:{title:'Collected water (L)'}}}
            config={{responsive:true,displaylogo:false}} />}
        {downloadError && <Alert severity="error">{downloadError}</Alert>}
        <Button variant="outlined" onClick={() => {setDownloadError('');downloadNativeResults(id).catch(error=>setDownloadError(error.message));}}>Download Results</Button>
    </Box>;
}
