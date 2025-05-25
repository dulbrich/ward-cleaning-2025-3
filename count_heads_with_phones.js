const fs = require('fs');

function countHeadsWithPhones() {
    try {
        // Load the JSON file
        const data = fs.readFileSync('docs/ward.json', 'utf8');
        const households = JSON.parse(data);
        
        // Count heads of households with phone numbers
        let count = 0;
        let totalHeads = 0;
        let headsWithPhones = [];
        
        for (const household of households) {
            const members = household.members || [];
            for (const member of members) {
                if (member.head === true) {
                    totalHeads++;
                    if (member.phone && member.phone.number) {
                        count++;
                        headsWithPhones.push({
                            name: member.name || 'Unknown',
                            phone: member.phone.number
                        });
                    }
                }
            }
        }
        
        console.log('Heads of households with phone numbers:');
        console.log('=====================================');
        headsWithPhones.forEach((head, index) => {
            console.log(`${index + 1}. ${head.name} - ${head.phone}`);
        });
        
        console.log('\nSummary:');
        console.log('========');
        console.log(`Total heads of households: ${totalHeads}`);
        console.log(`Heads of households with phone numbers: ${count}`);
        console.log(`Percentage with phone numbers: ${((count/totalHeads)*100).toFixed(1)}%`);
        
        return count;
        
    } catch (error) {
        console.error('Error reading or parsing the file:', error.message);
        return 0;
    }
}

// Run the function
countHeadsWithPhones(); 