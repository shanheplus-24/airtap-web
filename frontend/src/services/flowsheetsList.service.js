export const getFlowsheetsList = () => {
    return fetch('/api/flowsheets/',{mode: 'cors'});
//        .then((response) => response.json())
};

export const uploadFlowsheet = (data) => {
    return fetch('/api/flowsheets/upload_flowsheet', {
        method: 'POST', 
        mode: 'cors',
        body: data
    });
}; 

export const deleteFlowsheet = (id) => {
    return fetch('/api/flowsheets/'+id+'/remove_flowsheet', {
        method: 'POST',
        mode: 'cors'
    });
}; 