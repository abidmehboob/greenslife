const axios = require('axios');

async function testAuthenticatedFlowerAPI() {
    try {
        console.log('Testing authenticated flower API...');
        
        // First, login to get a token
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'wholesaler@test.com',
            password: 'password123'
        });
        
        console.log('Login successful, token obtained');
        const token = loginResponse.data.token;
        const user = loginResponse.data.user;
        console.log('User type:', user.userType);
        
        // Now make an authenticated request to flowers API
        const flowersResponse = await axios.get('http://localhost:3001/api/flowers', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Authenticated API Response Status:', flowersResponse.status);
        console.log('Number of flowers returned:', flowersResponse.data.flowers ? flowersResponse.data.flowers.length : 0);
        
        if (flowersResponse.data.flowers && flowersResponse.data.flowers.length > 0) {
            const firstFlower = flowersResponse.data.flowers[0];
            console.log('\n=== FIRST FLOWER PRICING (Authenticated as Wholesaler) ===');
            console.log('Flower name:', firstFlower.name);
            console.log('Pricing structure:', JSON.stringify(firstFlower.pricing, null, 2));
        }
        
    } catch (error) {
        console.error('Error testing authenticated API:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        if (error.code) {
            console.error('Error code:', error.code);
        }
    }
}

testAuthenticatedFlowerAPI();