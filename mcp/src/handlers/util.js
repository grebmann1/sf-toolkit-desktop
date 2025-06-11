
/**
 * Utility to handle fetch responses and catch 404 errors for SF Toolkit API calls.
 * If a 404 is detected, returns a user-friendly message to open the SF Toolkit first.
 * Otherwise, returns the parsed JSON or throws the error.
 */
async function handleFetchWithToolkitCheck(fetchPromise) {
    try {
        const response = await fetchPromise;
        // Try to parse JSON, fallback to text if not JSON
        let data;
        try {
            data = await response.json();
        } catch (e) {
            data = await response.text();
        }
        return { response, data };
    } catch (err) {
        return {
            content: [
                {
                    type: 'text',
                    text: `SF Toolkit is not open. Please open the SF Toolkit first using the global.openToolkitProtocol tool. 
                        Error :${JSON.stringify(err)}
                    `,
                },
            ],
        };
    }
}

module.exports = { handleFetchWithToolkitCheck }; 