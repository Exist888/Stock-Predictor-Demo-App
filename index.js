import { dates } from '/utils/dates';
import { Filter } from 'bad-words';

const filter = new Filter();
const tickersArr = [];

const generateReportBtn = document.querySelector('.generate-report-btn');

generateReportBtn.addEventListener('click', fetchStockData);

document.getElementById('ticker-input-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const tickerInput = document.getElementById('ticker-input');
    
    if (tickerInput.value.length > 2 && !filter.isProfane(tickerInput.value)) {
        generateReportBtn.disabled = false;
        const newTickerStr = tickerInput.value;
        tickersArr.push(newTickerStr.toUpperCase());
        tickerInput.value = '';
        renderTickers(); 
    } else if (filter.isProfane(tickerInput.value)) {
        tickerInput.value = '';
        alert('Please keep it clean. This is a family friendly app.');
    } else {
        const label = document.getElementsByTagName('label')[0];
        label.style.color = 'red';
        label.textContent = 'You must add at least one ticker. A ticker is a 3 letter or more code for a stock. E.g TSLA for Tesla.';
    } 
})

function renderTickers() {
    const tickersDiv = document.querySelector('.ticker-choice-display');
    tickersDiv.innerHTML = '';
    tickersArr.forEach((ticker) => {
        const newTickerSpan = document.createElement('span');
        newTickerSpan.textContent = ticker;
        newTickerSpan.classList.add('ticker');
        tickersDiv.appendChild(newTickerSpan);
    });
}

const loadingArea = document.querySelector('.loading-panel');
const apiMessage = document.getElementById('api-message');

async function fetchStockData() {
    document.querySelector('.action-panel').style.display = 'none';
    loadingArea.style.display = 'flex';
    try {
        const stockData = await Promise.all(tickersArr.map(async (ticker) => {
            const baseUrl = 'https://polygon-api-worker.masterydigital.workers.dev/';

            // Get recent dates from `dates` utility
            const startDate = dates.startDate;
            const endDate = dates.endDate;

            // Add query parameters
            const url = `${baseUrl}?ticker=${ticker}&startDate=${startDate}&endDate=${endDate}`;
            const response = await fetch(url);

            if (!response.ok) {
                const errMsg = await response.text();
                throw new Error(`Worker error: ${errMsg}`);
            }
            apiMessage.innerText = 'Creating report...';
            return response.text();
        }));
        fetchReport(stockData.join(''));
    } catch (err) {
        loadingArea.innerText = 'There was an error fetching stock data.';
        console.error(err.message);
    }
}

async function fetchReport(data) {
    const messages = [
        {
            role: 'system',
            content: 'You are a trading guru. Given data on share prices over the past 3 days, write a report of no more than 150 words describing the stocks performance and recommending whether to buy, hold or sell. Please use some zest in your descriptions to make them fun, creative, and colorful.'
        },
        {
            role: 'user',
            content: data
        }
    ]

    try {
        // Fetching data from Cloudflare url which contains our Open Ai worker in /dodgy-dave
        const url = 'https://dodgy-dave.masterydigital.workers.dev/';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // Send messages array from above into body of request
            body: JSON.stringify(messages)
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Worker error: ${data.error}`);
        }
        renderReport(data.content);

    } catch (err) {
        console.error(err.message);
        loadingArea.innerText = 'Unable to access AI. Please refresh and try again';
    }
}

function renderReport(output) {
    loadingArea.style.display = 'none';
    const outputArea = document.querySelector('.output-panel');
    const report = document.createElement('p');
    outputArea.appendChild(report);
    report.textContent = output;
    outputArea.style.display = 'flex';
}