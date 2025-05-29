async function fetchVersion() {
    try {
        const response = await fetch('http://localhost:5000/version');
        if (!response.ok) throw new Error('Failed to fetch version');
        
        const data = await response.json();
        const appVersion = data.app_version || 'Unavailable';
        
        document.getElementById('version-display').textContent = `v${appVersion}`;
    } catch (error) {
        console.error('Error fetching version:', error);
        document.getElementById('version-display').textContent = 'Unavailable';
    }
}

document.addEventListener('DOMContentLoaded', fetchVersion);