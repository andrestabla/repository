
async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/generator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'mindmap',
                message: 'Liderazgo de servicio',
                selectedAssetIds: [],
                selectedResearchIds: []
            })
        })
        console.log("Status:", res.status)
        const text = await res.text()
        console.log("Response:", text)
    } catch (e) {
        console.error(e)
    }
}
test()
