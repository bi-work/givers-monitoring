import './imports'

const totalDiff = BigInt('115792089237277217110272752943501742914102634520085823245724998868298727686144')
const hashrate3080 = BigInt('2000000000')

async function main() {
    console.log('main')
    const client = new TonClient({
        endpoint: 'https://toncenter.com/api/v2/jsonRPC',

    });

    // Function to update a single giver's balance
    async function updateGiverBalance(giver, index) {
        try {
            // Parse the address from the current giver
            const address = Address.parse(giver);
            const giverAddress = giverAddresses[index]


            // Fetch the balance using the parsed address
            await delay(1000)
            const balanceResponse = await CallForSuccess(() => client.callGetMethod(
                address,
                'get_wallet_data',
                []
            ), 20, 500);
            await delay(500)
            const powRes = await CallForSuccess(() => client.callGetMethod(
                Address.parse(giverAddress),
                'get_pow_params',
                []
            ), 20, 500);

            // Read the number from the balance response
            const balance = balanceResponse.stack.readNumber();

            const seed = powRes.stack.readBigNumber()
            const complexity = powRes.stack.readBigNumber()
            const iterations = powRes.stack.readBigNumber()

            console.log('com', giverAddress, complexity)

            // Format the number with commas
            const formattedBalance = Math.floor(balance / 1e9).toLocaleString();
            const hashes = totalDiff / complexity
            const seconds3080 = hashes / hashrate3080

            // Update the progress bar for the current giver
            const progress = document.getElementById(`giver${index + 1}`);
            if (progress) {
                progress.value = balance; // You may need to adjust based on your scale
                const label = progress.previousElementSibling; // Assuming label is right before progress bar
                console.log(label.textContent.split('#')[0] +
                    '#' +
                    ((index % 10) + 1) +
                    ' - Balance: ' +
                    formattedBalance +
                    ' GPU'
                    + ' Hashes: ' + formatN(Number(hashes))
                    + ' Seconds on 3080: ' + seconds3080, ' complexity', complexity)
                label.textContent =
                    label.textContent.split('#')[0] +
                    '#' +
                    ((index % 10) + 1) +
                    ' - Balance: ' +
                    formattedBalance +
                    ' GPU'
                    + ' Hashes: ' + formatN(Number(hashes))
                    + ' Seconds on 3080: ' + seconds3080
            }
            
            const updatedProgress = document.getElementById('updatedProgress');
            let nowDate = new Date();
            updatedProgress.textContent = 'Updated: ';
            await delay(200)
            updatedProgress.textContent = 'Updated: ' + nowDate.getFullYear() + '-' + ('0' + (nowDate.getMonth()+1)).slice(-2) + '-' + ('0' + nowDate.getDate()).slice(-2) + ' ' + nowDate.getHours() + ':' + ('0' + nowDate.getMinutes()).slice(-2) + ':' + ('0' + nowDate.getSeconds()).slice(-2);

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
                const label = totalProgress.previousElementSibling.previousElementSibling;
                label.textContent =
                    'Total Givers Balance: ' +
                    Math.floor(total / 1e9).toLocaleString() +
                    ' / ' +
                    Number(1000000000).toLocaleString() +
                    ' GPU';
            }
            {
                const label = totalProgress.previousElementSibling;
                label.textContent =
                    'Mining Progress: ' +
                    (
                        ((1000000000000000000 - total) / 1000000000000000000) *
                        100
                    ).toFixed('2') +
                    '%';
            }
        }
    }

    // Infinite loop to update balances
    while (true) {
        // Create a promise for each giver's balance update

        // const updatePromises = givers.map(updateGiverBalance);

        let balances = []
        for (const [giver, i] of givers.entries()) {
            const b = await updateGiverBalance(i, giver)
            balances.push(b)
        }
        // Wait for all updates to complete and sum the balances
        // const balances = await Promise.all(updatePromises);
        const totalBalance = balances.reduce(
            (acc, balance) => acc + balance,
            0
        );

        // Update the total mining progress bar
        updateTotalMiningProgress(totalBalance);

        // Wait for 300 seconds before starting the next iteration
        await new Promise((resolve) => setTimeout(resolve, 90000));
    }
}

// Call the function to start the update process
// document.addEventListener('DOMContentLoaded', (event) => {
//     console.log('event')
//     main();
// });

// console.log('main.js')
main()

function formatN(n) {
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

export async function CallForSuccess(
    toCall,
    attempts = 20,
    delayMs = 100
) {
    if (typeof toCall !== 'function') {
        throw new Error('unknown input')
    }

    let i = 0
    let lastError

    while (i < attempts) {
        try {
            const res = await toCall()
            return res
        } catch (err) {
            lastError = err
            i++
            await delay(delayMs)
        }
    }

    console.log('error after attempts', i)
    throw lastError
}

export function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}
