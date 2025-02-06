import { fetchJson, formatTimestamp, copyToClipboard } from './utils.js'

export function initBlockExplorer() {
  const blockExplorerForm = document.getElementById('blockExplorerForm')
  if (!blockExplorerForm) return
  blockExplorerForm.addEventListener('submit', function (event) {
    event.preventDefault()
    const networkSelect = document.getElementById('network')
    const blockNumberInput = document.getElementById('blockNumber')
    const apiKeyInput = document.getElementById('apiKey')
    const network = networkSelect.value
    const blockNumber = blockNumberInput.value.trim()
    const apiKey = apiKeyInput.value.trim()
    doBlockExplorerFetch(network, blockNumber, apiKey)
  })
}

export function doBlockExplorerFetch(network, blockNumber, apiKey) {
  const resultDiv = document.getElementById('blockExplorerResult')
  const processingMessage = document.getElementById('blockProcessingMessage')
  const blockInfoDiv = document.getElementById('blockInfo')
  const blockHashSpan = document.getElementById('blockHash')
  const blockNumberInfoSpan = document.getElementById('blockNumberInfo')
  const blockTimestampSpan = document.getElementById('blockTimestamp')
  const blockTransactionsDiv = document.getElementById('blockTransactions')
  const blockConsensusRootSpan = document.getElementById('blockConsensusRoot')
  const blockPreviousHashSpan = document.getElementById('blockPreviousHash')
  const blockValidatorSpan = document.getElementById('blockValidator')
  const blockErrorMessageDiv = document.getElementById('blockErrorMessage')
  const transactionsTableBody = document.querySelector('#transactionsTable tbody')
  if (resultDiv) resultDiv.classList.remove('error')
  processingMessage.style.display = 'none'
  blockInfoDiv.style.display = 'none'
  blockErrorMessageDiv.style.display = 'none'
  blockHashSpan.innerText = ''
  blockNumberInfoSpan.innerText = ''
  blockTimestampSpan.innerText = ''
  blockConsensusRootSpan.innerText = ''
  blockPreviousHashSpan.innerText = ''
  blockValidatorSpan.innerText = ''
  transactionsTableBody.innerHTML = ''
  blockTransactionsDiv.style.display = 'none'
  if (!network) {
    displayError('Please select a network.')
    return
  }
  if (blockNumber === '' || isNaN(blockNumber) || parseInt(blockNumber) < 0) {
    displayError('Please enter a valid block number.')
    return
  }
  processingMessage.style.display = 'block'
  if (resultDiv) resultDiv.style.display = 'block'
  let url =
    'https://api.sentichain.com/blockchain/get_block_by_number?network=' +
    encodeURIComponent(network) +
    '&block_number=' +
    encodeURIComponent(parseInt(blockNumber))
  if (apiKey) url += '&api_key=' + encodeURIComponent(apiKey)
  fetchJson(url)
    .then((data) => {
      if (!data.block) {
        throw new Error('Missing "block" data in response.')
      }
      const block = data.block
      const fields = [
        'block_number',
        'consensus_root',
        'hash',
        'previous_hash',
        'timestamp',
        'validator',
      ]
      for (let field of fields) {
        if (!(field in block)) {
          throw new Error('Missing field in response: ' + field)
        }
      }
      blockNumberInfoSpan.innerText = block.block_number
      blockHashSpan.innerText = block.hash
      blockPreviousHashSpan.innerText = block.previous_hash
      blockConsensusRootSpan.innerText = block.consensus_root
      blockTimestampSpan.innerText = formatTimestamp(block.timestamp)
      blockValidatorSpan.innerText = block.validator
      if (block.transactions) {
        const transactions = block.transactions
        Object.keys(transactions).forEach((txHash) => {
          const tx = transactions[txHash]
          const row = buildTransactionRow(txHash, tx)
          transactionsTableBody.appendChild(row.mainRow)
          transactionsTableBody.appendChild(row.detailsRow)
        })
        if (Object.keys(transactions).length > 0) {
          blockTransactionsDiv.style.display = 'block'
        }
      }
      processingMessage.style.display = 'none'
      blockInfoDiv.style.display = 'block'
    })
    .catch((error) => {
      displayError(error.message)
    })
  function displayError(msg) {
    if (resultDiv) resultDiv.classList.add('error')
    blockErrorMessageDiv.innerText = 'Error: ' + msg
    blockErrorMessageDiv.style.display = 'block'
    processingMessage.style.display = 'none'
    blockInfoDiv.style.display = 'none'
  }
}

function buildTransactionRow(txHash, tx) {
  const row = document.createElement('tr')
  const txHashCell = document.createElement('td')
  txHashCell.innerText = txHash
  row.appendChild(txHashCell)
  const timestampCell = document.createElement('td')
  timestampCell.innerText = formatTimestamp(tx.post_timestamp)
  row.appendChild(timestampCell)
  const actionsCell = document.createElement('td')
  const toggleDetailsBtn = document.createElement('button')
  toggleDetailsBtn.innerText = 'View Details'
  toggleDetailsBtn.classList.add('submit-btn')
  actionsCell.appendChild(toggleDetailsBtn)
  row.appendChild(actionsCell)
  const detailsRow = document.createElement('tr')
  detailsRow.style.display = 'none'
  detailsRow.classList.add('details-row')
  const detailsCell = document.createElement('td')
  detailsCell.colSpan = 3
  detailsCell.innerHTML = buildTxDetailsHtml(txHash, tx)
  detailsRow.appendChild(detailsCell)
  toggleDetailsBtn.onclick = () => {
    if (detailsRow.style.display === 'none') {
      detailsRow.style.display = 'table-row'
      toggleDetailsBtn.innerText = 'Hide Details'
    } else {
      detailsRow.style.display = 'none'
      toggleDetailsBtn.innerText = 'View Details'
    }
  }
  return { mainRow: row, detailsRow }
}

function buildTxDetailsHtml(txHash, tx) {
  const sanitize = (str) => str.replace(/[^a-zA-Z0-9]/g, '_')
  const h = sanitize(txHash)
  const vId = 'transactionVector_' + h
  const sId = 'transactionSignature_' + h
  const pId = 'transactionPostContent_' + h
  const kId = 'transactionPublicKey_' + h
  const vsId = 'transactionVectorSignature_' + h
  const cvId = 'copyFeedback' + vId
  const csId = 'copyFeedback' + sId
  const cpId = 'copyFeedback' + pId
  const ckId = 'copyFeedback' + kId
  const cvsId = 'copyFeedback' + vsId
  const serializedVector = '[' + tx.vector.join(', ') + ']'
  return (
    '<table class="details-table">' +
    '<tr><td><strong>Nonce:</strong> ' +
    tx.nonce +
    '</td></tr>' +
    '<tr><td><strong>Post Content:</strong>' +
    '<div class="copyable-output" id="' +
    pId +
    '" onclick="copyToClipboard(\'' +
    pId +
    '\')" title="Click to copy">' +
    tx.post_content +
    '</div></td></tr>' +
    '<tr><td><strong>Post Link:</strong>' +
    '<a href="https://x.com/' +
    tx.post_link +
    '" target="_blank">View Post</a></td></tr>' +
    '<tr><td><strong>Sender:</strong> ' +
    tx.sender +
    '</td></tr>' +
    '<tr><td><strong>Signature:</strong>' +
    '<div class="signature-output" id="' +
    sId +
    '" onclick="copyToClipboard(\'' +
    sId +
    '\')" title="Click to copy">' +
    tx.signature +
    '</div></td></tr>' +
    '<tr><td><strong>Vector:</strong>' +
    '<div class="copyable-output" id="' +
    vId +
    '" onclick="copyToClipboard(\'' +
    vId +
    '\')" title="Click to copy">' +
    serializedVector +
    '</div></td></tr>' +
    '<tr><td><strong>Public Key:</strong>' +
    '<div class="copyable-output" id="' +
    kId +
    '" onclick="copyToClipboard(\'' +
    kId +
    '\')" title="Click to copy">' +
    tx.public_key +
    '</div></td></tr>' +
    '<tr><td><strong>Vector Signature:</strong>' +
    '<div class="copyable-output" id="' +
    vsId +
    '" onclick="copyToClipboard(\'' +
    vsId +
    '\')" title="Click to copy">' +
    tx.vector_signature +
    '</div></td></tr>' +
    '</table>' +
    '<div class="copy-feedback" id="' +
    cvId +
    '">Copied!</div>' +
    '<div class="copy-feedback" id="' +
    csId +
    '">Copied!</div>' +
    '<div class="copy-feedback" id="' +
    cpId +
    '">Copied!</div>' +
    '<div class="copy-feedback" id="' +
    ckId +
    '">Copied!</div>' +
    '<div class="copy-feedback" id="' +
    cvsId +
    '">Copied!</div>'
  )
}
