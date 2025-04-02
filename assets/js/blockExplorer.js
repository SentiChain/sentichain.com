function copyToClipboard(elementId) {
    let text = '';
    const element = document.getElementById(elementId);
    if (element) text = element.innerText;
    navigator.clipboard
        .writeText(text)
        .then(() => {
            let feedbackId;
            if (elementId.startsWith('block')) {
                const suffix = elementId.replace('block', '');
                feedbackId =
                    'copyFeedback' + suffix.charAt(0).toUpperCase() + suffix.slice(1);
            } else if (elementId.startsWith('transaction')) {
                const suffix = elementId.replace(/transaction[A-Z][a-z]+_/, '');
                const prefix = elementId.match(/transaction([A-Za-z]+)/)[1];
                feedbackId =
                    'copyFeedback' +
                    prefix.charAt(0).toUpperCase() +
                    prefix.slice(1) +
                    '_' +
                    suffix;
            } else {
                feedbackId = 'copyFeedback' + elementId.replace('Output', '');
            }

            const feedback = document.getElementById(feedbackId);
            if (feedback) {
                feedback.classList.add('show');
                setTimeout(() => {
                    feedback.classList.remove('show');
                }, 2000);
            }

            if (element) {
                const originalColor = element.style.backgroundColor;
                element.style.backgroundColor = '#00FFC8';
                setTimeout(() => {
                    element.style.backgroundColor = originalColor;
                }, 500);
            }
        })
        .catch((err) => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy the content. Please try manually.');
        });
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (UTC)`;
}

function safeValue(val) {
    return val === "A valid API Key is required" ? "A valid API Key is required" : val;
}

function serializeMatrix(mat) {
    if (!Array.isArray(mat)) {
        return "A valid API Key is required";
    }
    if (mat.length > 0 && Array.isArray(mat[0])) {
        return `[${mat.map(row => 
            `[${row.map(n => (Number.isInteger(n) ? n.toFixed(1) : n)).join(', ')}]`
        ).join(', ')}]`;
    }
    return `[${mat.map((n) => (Number.isInteger(n) ? n.toFixed(1) : n)).join(', ')}]`;
}

function doBlockExplorerFetch(network, blockNumber, apiKey) {
    const resultDiv = document.getElementById('blockExplorerResult');
    const processingMessage = document.getElementById('blockProcessingMessage');
    const blockInfoDiv = document.getElementById('blockInfo');
    const blockHashSpan = document.getElementById('blockHash');
    const blockNumberInfoSpan = document.getElementById('blockNumberInfo');
    const blockTimestampSpan = document.getElementById('blockTimestamp');
    const blockTransactionsDiv = document.getElementById('blockTransactions');
    const blockConsensusRootSpan = document.getElementById('blockConsensusRoot');
    const blockPreviousHashSpan = document.getElementById('blockPreviousHash');
    const blockValidatorSpan = document.getElementById('blockValidator');
    const blockErrorMessageDiv = document.getElementById('blockErrorMessage');
    const transactionsTableBody = document.querySelector('#transactionsTable tbody');

    resultDiv.classList.remove('error');
    processingMessage.style.display = 'none';
    blockInfoDiv.style.display = 'none';
    blockErrorMessageDiv.style.display = 'none';
    blockHashSpan.innerText = '';
    blockNumberInfoSpan.innerText = '';
    blockTimestampSpan.innerText = '';
    blockConsensusRootSpan.innerText = '';
    blockPreviousHashSpan.innerText = '';
    blockValidatorSpan.innerText = '';
    transactionsTableBody.innerHTML = '';
    blockTransactionsDiv.style.display = 'none';

    if (!network) {
        blockErrorMessageDiv.innerText = 'Please select a network.';
        blockErrorMessageDiv.style.display = 'block';
        resultDiv.style.display = 'block';
        return;
    }
    if (blockNumber === '' || isNaN(blockNumber) || parseInt(blockNumber) < 0) {
        blockErrorMessageDiv.innerText = 'Please enter a valid block number.';
        blockErrorMessageDiv.style.display = 'block';
        resultDiv.style.display = 'block';
        return;
    }

    processingMessage.style.display = 'block';
    resultDiv.style.display = 'block';

    let GET_BLOCK_BY_NUMBER_URL = `https://api.sentichain.com/blockchain/get_block_by_number?network=${encodeURIComponent(
        network
    )}&block_number=${encodeURIComponent(parseInt(blockNumber))}`;

    if (apiKey) {
        GET_BLOCK_BY_NUMBER_URL += `&api_key=${encodeURIComponent(apiKey)}`;
    }
    fetch(GET_BLOCK_BY_NUMBER_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    })
        .then((response) => {
            if (response.status === 404) {
                throw new Error('Block not found.');
            }
            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then((data) => {
            if (!('block' in data)) {
                throw new Error('Missing "block" data in response.');
            }
            const block = data.block;
            const requiredFields = [
                'block_number',
                'consensus_root',
                'hash',
                'previous_hash',
                'block_timestamp',
                'validator',
            ];
            for (let field of requiredFields) {
                if (!(field in block)) {
                    throw new Error(`Missing field in response: ${field}`);
                }
            }

            blockNumberInfoSpan.innerText = block.block_number;
            blockHashSpan.innerText = block.hash;
            blockPreviousHashSpan.innerText = block.previous_hash;
            blockConsensusRootSpan.innerText = block.consensus_root;
            blockTimestampSpan.innerText = formatTimestamp(block.block_timestamp);
            blockValidatorSpan.innerText = block.validator;

            if ('transactions' in block) {
                const transactions = block.transactions;
                for (let txHash in transactions) {
                    if (transactions.hasOwnProperty(txHash)) {
                        const tx = transactions[txHash];
                        const row = document.createElement('tr');

                        const txHashCell = document.createElement('td');
                        txHashCell.innerText = txHash;
                        row.appendChild(txHashCell);

                        const timestampCell = document.createElement('td');
                        timestampCell.innerText = (tx.post_timestamp === "A valid API Key is required")
                            ? "A valid API Key is required"
                            : formatTimestamp(tx.post_timestamp);
                        row.appendChild(timestampCell);

                        const actionsCell = document.createElement('td');
                        const toggleDetailsBtn = document.createElement('button');
                        toggleDetailsBtn.innerText = 'View Details';
                        toggleDetailsBtn.classList.add('submit-btn');

                        const detailsRow = document.createElement('tr');
                        detailsRow.style.display = 'none';
                        detailsRow.classList.add('details-row');
                        const detailsCell = document.createElement('td');
                        detailsCell.colSpan = 3;

                        const serializedMatrix = serializeMatrix(tx.post_matrix);

                        const sanitizedTxHash = txHash.replace(/[^a-zA-Z0-9]/g, '_');
                        const matrixId = `transactionMatrix_${sanitizedTxHash}`;
                        const signatureId = `transactionSignature_${sanitizedTxHash}`;
                        const sourceId = `transactionSource_${sanitizedTxHash}`;
                        const publicKeyId = `transactionPublicKey_${sanitizedTxHash}`;
                        const matrixSignatureId = `transactionMatrixSignature_${sanitizedTxHash}`;

                        const copyFeedbackMatrixId = `copyFeedbackMatrix_${sanitizedTxHash}`;
                        const copyFeedbackSignatureId = `copyFeedbackSignature_${sanitizedTxHash}`;
                        const copyFeedbackSourceId = `copyFeedbackSource_${sanitizedTxHash}`;
                        const copyFeedbackPublicKeyId = `copyFeedbackPublicKey_${sanitizedTxHash}`;
                        const copyFeedbackMatrixSignatureId = `copyFeedbackMatrixSignature_${sanitizedTxHash}`;

                        let postLinkHtml = '';
                        if (tx.post_link === 'A valid privileged API Key is required') {
                            postLinkHtml = '<span>A valid privileged API Key is required</span>';
                        } else {
                            postLinkHtml = `<a href="https://x.com/${tx.post_link}" target="_blank">View Post</a>`;
                        }

                        detailsCell.innerHTML = `
                            <table class="details-table">
                                <tr>
                                    <td><strong>Nonce:</strong> ${tx.nonce}</td>
                                </tr>

                                <!--
                                <tr>
                                    <td><strong>Post Content:</strong>
                                        <div
                                            class="copyable-output"
                                            id="${sourceId}"
                                            onclick="copyToClipboard('${sourceId}')"
                                            title="Click to copy"
                                        >
                                            ${tx.source}
                                        </div>
                                    </td>
                                </tr>
                                -->

                                <!--
                                <tr>
                                    <td><strong>Post Link:</strong> ${postLinkHtml}</td>
                                </tr>
                                -->

                                <tr>
                                    <td><strong>Sender:</strong> ${tx.sender}</td>
                                </tr>
                                <tr>
                                    <td><strong>Signature:</strong>
                                        <div
                                            class="signature-output"
                                            id="${signatureId}"
                                            onclick="copyToClipboard('${signatureId}')"
                                            title="Click to copy"
                                        >
                                            ${tx.signature}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Matrix:</strong>
                                        <div
                                            class="copyable-output"
                                            id="${matrixId}"
                                            onclick="copyToClipboard('${matrixId}')"
                                            title="Click to copy"
                                        >
                                            ${serializedMatrix}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Public Key:</strong>
                                        <div
                                            class="copyable-output"
                                            id="${publicKeyId}"
                                            onclick="copyToClipboard('${publicKeyId}')"
                                            title="Click to copy"
                                        >
                                            ${tx.public_key}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Matrix Signature:</strong>
                                        <div
                                            class="copyable-output"
                                            id="${matrixSignatureId}"
                                            onclick="copyToClipboard('${matrixSignatureId}')"
                                            title="Click to copy"
                                        >
                                            ${tx.matrix_signature}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            <div class="copy-feedback" id="${copyFeedbackMatrixId}">Copied!</div>
                            <div class="copy-feedback" id="${copyFeedbackSignatureId}">Copied!</div>
                            <div class="copy-feedback" id="${copyFeedbackSourceId}">Copied!</div>
                            <div class="copy-feedback" id="${copyFeedbackPublicKeyId}">Copied!</div>
                            <div class="copy-feedback" id="${copyFeedbackMatrixSignatureId}">Copied!</div>
                        `;
                        detailsRow.appendChild(detailsCell);

                        toggleDetailsBtn.onclick = () => {
                            if (detailsRow.style.display === 'none') {
                                detailsRow.style.display = 'table-row';
                                toggleDetailsBtn.innerText = 'Hide Details';
                            } else {
                                detailsRow.style.display = 'none';
                                toggleDetailsBtn.innerText = 'View Details';
                            }
                        };

                        actionsCell.appendChild(toggleDetailsBtn);
                        row.appendChild(actionsCell);
                        transactionsTableBody.appendChild(row);
                        transactionsTableBody.appendChild(detailsRow);
                    }
                }
                if (Object.keys(transactions).length > 0) {
                    blockTransactionsDiv.style.display = 'block';
                }
            } else {
                console.info(
                    'No "transactions" field returned. Possibly invalid or no API key used.'
                );
            }

            processingMessage.style.display = 'none';
            blockInfoDiv.style.display = 'block';
        })
        .catch((error) => {
            console.error('Block Explorer Error:', error);
            resultDiv.classList.add('error');
            blockErrorMessageDiv.innerText = `Error: ${error.message}`;
            blockErrorMessageDiv.style.display = 'block';
            processingMessage.style.display = 'none';
            blockInfoDiv.style.display = 'none';
        });
}

function formatApiUtcToLocal(apiUtcString) {
    const dateObj = new Date(apiUtcString);
    if (isNaN(dateObj.getTime())) {
        return apiUtcString;
    }
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const hh = String(dateObj.getHours()).padStart(2, '0');
    const min = String(dateObj.getMinutes()).padStart(2, '0');
    const ss = String(dateObj.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function parseUserLocalTimestamp(localString) {
    const re = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/;
    const match = localString.match(re);
    if (!match) return null;
    const [, yyyy, mm, dd, hh, min, ss] = match.map(Number);
    const dateObj = new Date(yyyy, mm - 1, dd, hh, min, ss);
    if (isNaN(dateObj.getTime())) {
        return null;
    }
    return dateObj.toISOString();
}

document.addEventListener('DOMContentLoaded', () => {
    const blockExplorerForm = document.getElementById('blockExplorerForm');
    const blockExplorerInput = document.getElementById('blockExplorerInput');
    const blockExplorerModeButton = document.getElementById('blockExplorerModeButton');
    const blockExplorerSubmitBtn = document.getElementById('blockExplorerSubmitBtn');
    let isBlockMode = true;

    blockExplorerModeButton.addEventListener('click', async () => {
        isBlockMode = !isBlockMode;
        if (isBlockMode) {
            blockExplorerModeButton.classList.add('block-mode');
            blockExplorerModeButton.title = 'Switch to Timestamp input';
            blockExplorerInput.placeholder = 'Block Number: e.g. 100';
            blockExplorerSubmitBtn.textContent = 'Get Block';
            const maybeTimestamp = blockExplorerInput.value.trim();
            if (maybeTimestamp) {
                const isoString = (() => {
                    const re = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/;
                    return re.test(maybeTimestamp) ? parseUserLocalTimestamp(maybeTimestamp) : null;
                })();
                if (isoString) {
                    try {
                        const resp = await fetch(
                            `https://api.sentichain.com/blockchain/get_block_number_from_timestamp?network=mainnet&timestamp=${encodeURIComponent(isoString)}`
                        );
                        if (!resp.ok) throw new Error(`Timestamp→Block fetch error (${resp.status})`);
                        const data = await resp.json();
                        if (!data.block_number) throw new Error('No block_number in response.');
                        blockExplorerInput.value = data.block_number;
                    } catch (err) {
                        console.error('Error auto-fetching block number:', err);
                    }
                }
            }
        } else {
            blockExplorerModeButton.classList.remove('block-mode');
            blockExplorerModeButton.title = 'Switch to Block Number input';
            blockExplorerInput.placeholder = 'Local Timestamp: e.g. 2025-01-01 13:00:00';
            blockExplorerSubmitBtn.textContent = 'Get Block (≤ Timestamp)';
            const maybeBlockNumber = blockExplorerInput.value.trim();
            if (/^\d+$/.test(maybeBlockNumber)) {
                try {
                    const resp = await fetch(
                        `https://api.sentichain.com/blockchain/get_timestamp_from_block_number?network=mainnet&block_number=${encodeURIComponent(maybeBlockNumber)}`
                    );
                    if (!resp.ok) throw new Error(`Block→Timestamp fetch error (${resp.status})`);
                    const data = await resp.json();
                    if (!data.timestamp) throw new Error('No timestamp in response.');
                    const newTimestamp = formatApiUtcToLocal(data.timestamp);
                    blockExplorerInput.value = newTimestamp;
                } catch (err) {
                    console.error('Error auto-fetching timestamp:', err);
                }
            }
        }
    });

    blockExplorerModeButton.classList.add('block-mode');
    blockExplorerInput.placeholder = 'Block Number: e.g. 100';
    blockExplorerSubmitBtn.textContent = "Get Block";
    if (blockExplorerInput && !blockExplorerInput.value.trim()) {
        fetch('https://api.sentichain.com/blockchain/get_chain_length?network=mainnet')
            .then((res) => res.json())
            .then((data) => {
                const chainLength = data.chain_length;
                if (!blockExplorerInput.value.trim()) {
                    blockExplorerInput.value = chainLength - 1;
                }
            })
            .catch((err) => {
                console.error('Error fetching chain length for Block Explorer:', err);
            });
    }

    if (blockExplorerForm) {
        blockExplorerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const networkSelect = document.getElementById('network');
            const apiKeyInput = document.getElementById('apiKey');

            const network = networkSelect.value;
            const userInput = blockExplorerInput.value.trim();
            const apiKey = apiKeyInput.value.trim();

            if (!userInput) {
                alert('Please enter a block number or timestamp.');
                return;
            }

            if (isBlockMode) {
                if (!/^\d+$/.test(userInput)) {
                    alert('Please enter a valid integer block number (e.g. 100).');
                    return;
                }
                const bn = parseInt(userInput, 10);
                if (bn < 0) {
                    alert('Please enter a non-negative block number (e.g. 100).');
                    return;
                }
                doBlockExplorerFetch(network, bn, apiKey);

            } else {
                const isoString = parseUserLocalTimestamp(userInput);
                if (!isoString) {
                    alert('Please enter a valid local Timestamp: YYYY-MM-DD HH:MM:SS');
                    return;
                }
                try {
                    const resp = await fetch(
                        `https://api.sentichain.com/blockchain/get_block_number_from_timestamp?network=mainnet&timestamp=${encodeURIComponent(isoString)}`
                    );
                    if (!resp.ok) {
                        throw new Error(`Timestamp->block fetch failed: ${resp.status}`);
                    }
                    const data = await resp.json();
                    if (!data.block_number) {
                        throw new Error('Response missing block_number');
                    }
                    doBlockExplorerFetch(network, data.block_number, apiKey);
                } catch (err) {
                    console.error('Timestamp mode error in block explorer:', err);
                    alert('Error retrieving block number from timestamp:\n' + err.message);
                }
            }
        });
    }
});

const blockExplorerForm = document.getElementById('blockExplorerForm');
if (blockExplorerForm) {
    blockExplorerForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const networkSelect = document.getElementById('network');
        const blockNumberInput = document.getElementById('blockNumber');
        const apiKeyInput = document.getElementById('apiKey');
        const network = networkSelect.value;
        const blockNumber = blockNumberInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        doBlockExplorerFetch(network, blockNumber, apiKey);
    });
}