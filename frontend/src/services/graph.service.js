export const getDiagram = (id) => {
    return fetch('/api/flowsheets/'+id+'/diagram', {mode: 'cors'});
}; 