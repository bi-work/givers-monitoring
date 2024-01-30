import './imports'

const totalDiff = BigInt('115792089237277217110272752943501742914102634520085823245724998868298727686144')
const hashrate3080 = BigInt('2000000000')

async function main() {
    console.log('main')
    const client = new TonClient({
        endpoint: await getHttpEndpoint(),
    });

    // Function to update a single giver's balance
    async function updateGiverBalance(giver, index) {
        try {
            // Parse the address from the current giver
            const address = Address.parse(giver);
            const giverAddress = giverAddresses[index]
            

            // Fetch the balance using the parsed address
            const balanceResponse = await client.callGetMethod(
                address,
                'get_wallet_data',
                []
            );
            const powRes = await client.callGetMethod(
                Address.parse(giverAddress),
                'get_pow_params',
                []
            );

            // Read the number from the balance response
            const balance = balanceResponse.stack.readNumber();

            const seed = powRes.stack.readBigNumber()
            const complexity = powRes.stack.readBigNumber()
            const iterations = powRes.stack.readBigNumber()

            console.log('com', complexity)

            // Format the number with commas
            const formattedBalance = Math.floor(balance / 1e9).toLocaleString();
            const hashes = totalDiff / complexity
            const seconds3080 = hashes / hashrate3080

            // Update the progress bar for the current giver
            const progress = document.getElementById(`giver${index + 1}`);
            if (progress) {
                progress.value = balance; // You may need to adjust based on your scale
                const label = progress.previousElementSibling; // Assuming label is right before progress bar
                label.textContent =
                    label.textContent.split('#')[0] +
                    '#' +
                    ((index % 10) + 1) +
                    ' - Balance: ' +
                    formattedBalance +
                    ' GRAM'
                    + ' Hashes: ' + formatN(Number(hashes))
                    + ' Seconds on 3080: ' + seconds3080
            }

            return balance; // Return the balance for use in the total
        } catch (error) {
            console.error('Error fetching balance for giver:', giver, error);
            return 0; // Return 0 if there was an error
        }
    }

    // Function to update the total mining progress
    function updateTotalMiningProgress(total) {
        const totalProgress = document.getElementById('totalMiningProgress');
        if (totalProgress) {
            totalProgress.value = total; // Assuming total is within the min-max range of the progress bar
            {
                const label =
                    totalProgress.previousElementSibling.previousElementSibling;
                label.textContent =
                    'Total Givers Balance: ' +
                    Math.floor(total / 1e9).toLocaleString() +
                    ' / ' +
                    Number(5000000000).toLocaleString() +
                    ' GRAM';
            }
            {
                const label = totalProgress.previousElementSibling;
                label.textContent =
                    'Mining Progress: ' +
                    (
                        ((5000000000000000000 - total) / 5000000000000000000) *
                        100
                    ).toFixed('2') +
                    '%';
            }
        }
    }

    // Infinite loop to update balances
    while (true) {
        // Create a promise for each giver's balance update
        const updatePromises = givers.map(updateGiverBalance);

        // Wait for all updates to complete and sum the balances
        const balances = await Promise.all(updatePromises);
        const totalBalance = balances.reduce(
            (acc, balance) => acc + balance,
            0
        );

        // Update the total mining progress bar
        updateTotalMiningProgress(totalBalance);

        // Wait for 10 seconds before starting the next iteration
        await new Promise((resolve) => setTimeout(resolve, 10000));
    }
}

// Call the function to start the update process
// document.addEventListener('DOMContentLoaded', (event) => {
//     console.log('event')
//     main();
// });

// console.log('main.js')
main()

function formatN (n) {
	const unitList = ['y', 'z', 'a', 'f', 'p', 'n', 'u', 'm', '', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
	const zeroIndex = 8;
	const nn = n.toExponential(2).split(/e/);
	let u = Math.floor(+nn[1] / 3) + zeroIndex;
	if (u > unitList.length - 1) {
		u = unitList.length - 1;
	} else
	if (u < 0) {
		u = 0;
	}
	return nn[0] * Math.pow(10, +nn[1] - (u - zeroIndex) * 3) + unitList[u];
}
