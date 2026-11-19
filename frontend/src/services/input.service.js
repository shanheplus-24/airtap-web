export const deleteConfig = (id, name) => {
    return fetch('/api/flowsheets/'+id+'/delete?name='+name, {mode: 'cors'});
}; 

export const updateNumberOfSubprocesses = (data) => {
    return fetch('/api/flowsheets/update_number_of_subprocesses', {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify(data)
    });
} 