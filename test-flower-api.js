const axios = require('axios');

async function testFlowerAPI() {
    try {
        console.log('Testing flower API...');
        const response = await axios.get('http://localhost:3001/api/flowers');
        console.log('API Response Status:', response.status);
        console.log('Number of flowers returned:', response.data.flowers ? response.data.flowers.length : 0);
        console.log('Sample data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error testing API:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testFlowerAPI();