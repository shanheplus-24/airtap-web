/**
 * Get the name of the project.
 *
 * @returns {Promise<Response>}
 */
export const getProjectName = () => {
    return fetch('/api/flowsheets/project', {mode: 'cors'})
        .then((response) => response.json());
}
