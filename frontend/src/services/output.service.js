import {jobRequest} from './nativeJobs.service';

export const solve = (id, data) => {
    return jobRequest('/api/flowsheets/'+id+'/solve', {
        method: 'POST', 
        mode: 'cors',
        body: JSON.stringify(data)
    });
}; 

export const sweep = (id, data) => {
    return jobRequest('/api/flowsheets/'+id+'/sweep', {
        method: 'POST', 
        mode: 'cors',
        body: JSON.stringify(data)
    });
}

export const downloadCSV = (id,data) => {
    return fetch('/api/flowsheets/'+id+'/download', {
        method: 'POST', 
        mode: 'cors',
        body: JSON.stringify(data)
    });
}

export const downloadSingleOutput = (id,data) => {
    return fetch('/api/flowsheets/'+id+'/downloadOutput', {
        method: 'POST', 
        mode: 'cors',
        body: JSON.stringify(data)
    });
}


export const saveConfig = (id,data,name, version) => {
    return fetch('/api/flowsheets/'+id+'/save?name='+name+'&version='+version, {
        method: 'POST', 
        mode: 'cors',
        body: JSON.stringify(data)
    });
}

export const listConfigNames = (id, version) => {
    return fetch('/api/flowsheets/'+id+'/list?version='+version, {mode: 'cors'});
}; 

export const loadConfig = (id, name) => {
    return fetch('/api/flowsheets/'+id+'/load?name='+name, {mode: 'cors'});
}; 

export const downloadSweepResults = (id) => {
    return fetch('/api/flowsheets/'+id+'/download_sweep', {
        method: 'GET', 
        mode: 'cors',
    });
}

