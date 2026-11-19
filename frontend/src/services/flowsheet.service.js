import {jobRequest} from './nativeJobs.service';


export const getFlowsheet = (id, build) => {
    return jobRequest('/api/flowsheets/'+id+'/config?build='+build, {mode: 'cors'});
    /*return new Promise((resolve, reject) => { 
        resolve(data3);
    });*/
    
}; 

export const saveFlowsheet = (id, data) => {
    return jobRequest('/api/flowsheets/'+id+'/update', {
        method: 'POST', 
        mode: 'cors',
        body: JSON.stringify(data)
    });
}; 

export const resetFlowsheet = (id) => {
    return jobRequest('/api/flowsheets/'+id+'/reset', {
        method: 'GET', 
        mode: 'cors'
    });
}; 

export const unbuildFlowsheet = (id) => {
    return jobRequest('/api/flowsheets/'+id+'/unbuild', {
        method: 'GET', 
        mode: 'cors'
    });
}; 

export const selectOption = (id, data) => {
    return jobRequest('/api/flowsheets/'+id+'/select_option', {
        method: 'POST', 
        mode: 'cors',
        body: JSON.stringify(data)
    });
}; 

export const getLogs = () => {
    return fetch('/api/flowsheets/get_logs', {
        method: 'GET', 
        mode: 'cors'
    });
}

export const downloadLogs = () => {
    return fetch('/api/flowsheets/download_logs', {
        method: 'POST', 
        mode: 'cors'
    });
}

export const setProject = (project) => {
    return fetch('/api/flowsheets/set_project/'+project, {
        method: 'GET', 
        mode: 'cors'
    });
}