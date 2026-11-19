import React, {useEffect, useState} from 'react';
import Plot from 'react-plotly.js';
import {Alert, Box, Button, Typography} from '@mui/material';

export default function AirTAPTrajectory({id, result}) {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        let active = true;
        fetch('/api/flowsheets/' + id + '/trajectory')
            .then(r => { if (!r.ok) throw Error('Time series unavailable'); return r.json(); })
            .then(d => {if (active) {setData(d); setError('');}})
            .catch(e => {if (active) setError(e.message);});
        return () => {active = false;};
    }, [id, result]);
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!data) return <Typography>Loading native trajectory…</Typography>;
    const rows = data.rows;
    const location = data.summary.location;
    return <Box sx={{mt: 4, width: '100%'}}>
        <Typography variant="h6">AirTAP transient results</Typography>
        <Typography variant="body2">{data.summary.model}</Typography>
        <Typography variant="body2">{location.name} · {location.latitude}, {location.longitude} · {location.timezone}</Typography>
        <Typography variant="body2">{location.origin_utc} → {location.end_utc} (end exclusive)</Typography>
        <Typography variant="body2">{typeof location.source === 'object' ? location.source.provider : location.source} · Cost water basis: {data.summary.economic_water_basis}</Typography>
        <Plot useResizeHandler style={{width: '100%', height: 430}}
            data={[
                {x: rows.map(r => r.local_time), y: rows.map(r => r.uptake_kg_kg), name: 'Material uptake', mode: 'lines', line: {color: '#226b92'}},
                {x: rows.map(r => r.local_time), y: rows.map(r => r.collected_L), name: 'Collected water', yaxis: 'y2', mode: 'lines', line: {color: '#b96531'}}
            ]}
            layout={{autosize: true, margin: {t: 30, l: 70, r: 70, b: 80},
                xaxis: {title: 'Local time'}, yaxis: {title: 'Uptake (kg/kg dry)'},
                yaxis2: {title: 'Collected water (L)', overlaying: 'y', side: 'right'},
                legend: {orientation: 'h', y: 1.16}, hovermode: 'x unified'}}
            config={{responsive: true, displaylogo: false}} />
        <Button variant="outlined" component="a" href={'/api/flowsheets/' + id + '/trajectory.csv'}>Download trajectory CSV</Button>
    </Box>;
}
