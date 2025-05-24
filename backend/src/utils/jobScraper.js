const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Extracts the job description from a Greenhouse job application link.
 * @param {string} jobUrl - The URL of the Greenhouse job posting.
 * @returns {Promise<string|null>} The job description text or null if an error occurs or content not found.
 */
async function extractGreenhouseJobDescription(jobUrl) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    };

    try {
        const response = await axios.get(jobUrl, {
            headers: headers,
            timeout: 15000
        });

        const html = response.data;
        const $ = cheerio.load(html);
        const contentDiv = $('.job__description.body');

        if (contentDiv.length > 0) {
            // Remove pay ranges section before processing
            contentDiv.find('.job__pay-ranges').remove();

            // Handle <br> tags and block elements
            contentDiv.find('br').replaceWith('\n');
            contentDiv.find('p, div, li, ul, ol, h1, h2, h3, h4, h5, h6, blockquote, pre, hr, table').each((i, el) => {
                $(el).prepend('\n');
                $(el).append('\n');
            });

            let jobDescriptionText = contentDiv.text();
            const lines = jobDescriptionText.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            const filteredLines = lines.filter(line => {
                const lowerLine = line.toLowerCase();
                return !(
                    lowerLine.includes('base pay') ||
                    lowerLine.includes('compensation') ||
                    lowerLine.includes('salary range') ||
                    lowerLine.includes('zone') ||
                    lowerLine.includes('benefits') ||
                    lowerLine.includes('click here to learn more') ||
                    lowerLine.includes('we\'re looking for more') ||
                    lowerLine.includes('robinhood embraces') ||
                    lowerLine.includes('robinhood provides') ||
                    lowerLine.includes('robinhood privacy policy')
                );
            });

            jobDescriptionText = filteredLines.join('\n');
            jobDescriptionText = jobDescriptionText.replace(/\n{3,}/g, '\n\n');

            return jobDescriptionText.trim();
        } else {
            console.warn(`Warning: Could not find the job description div (class='job__description body') for URL: ${jobUrl}`);
            return null;
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Axios error fetching URL ${jobUrl}: ${error.message}`);
            if (error.response) {
                console.error(`Status: ${error.response.status}`);
            }
        } else {
            console.error(`An unexpected error occurred while processing ${jobUrl}: ${error.message}`);
        }
        return null;
    }
}

/**
 * Extracts the job description from a Lever job posting.
 * @param {string} jobUrl - The URL of the Lever job posting.
 * @returns {Promise<string|null>} The job description text or null if an error occurs or content not found.
 */
async function extractLeverJobDescription(jobUrl) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    };

    try {
        const response = await axios.get(jobUrl, {
            headers: headers,
            timeout: 15000
        });

        const html = response.data;
        const $ = cheerio.load(html);
        
        // Remove the apply button section before processing
        $('[data-qa="btn-apply-bottom"]').remove();
        
        // Lever job descriptions are in a div with class="content"
        const contentDiv = $('.content');

        if (contentDiv.length > 0) {
            // Handle <br> tags and block elements
            contentDiv.find('br').replaceWith('\n');
            contentDiv.find('p, div, li, ul, ol, h1, h2, h3, h4, h5, h6, blockquote, pre, hr, table').each((i, el) => {
                $(el).prepend('\n');
                $(el).append('\n');
            });

            let jobDescriptionText = contentDiv.text();
            const lines = jobDescriptionText.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            // Filter out common sections we don't want
            const filteredLines = lines.filter(line => {
                const lowerLine = line.toLowerCase();
                return !(
                    lowerLine.includes('compensation') ||
                    lowerLine.includes('salary range') ||
                    lowerLine.includes('$') ||
                    lowerLine.includes('benefits') ||
                    lowerLine.includes('how to apply') ||
                    lowerLine.includes('about us') ||
                    lowerLine.includes('equal opportunity') ||
                    lowerLine.includes('diversity')
                );
            });

            jobDescriptionText = filteredLines.join('\n');
            jobDescriptionText = jobDescriptionText.replace(/\n{3,}/g, '\n\n');

            return jobDescriptionText.trim();
        } else {
            console.warn(`Warning: Could not find the job description div (class='content') for URL: ${jobUrl}`);
            return null;
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Axios error fetching URL ${jobUrl}: ${error.message}`);
            if (error.response) {
                console.error(`Status: ${error.response.status}`);
            }
        } else {
            console.error(`An unexpected error occurred while processing ${jobUrl}: ${error.message}`);
        }
        return null;
    }
}

/**
 * Extracts the job description from an Ashby job posting.
 * @param {string} jobUrl - The URL of the Ashby job posting.
 * @returns {Promise<string|null>} The job description text or null if an error occurs or content not found.
 */
async function extractAshbyJobDescription(jobUrl) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    };

    try {
        console.log('Fetching Ashby job posting:', jobUrl);
        const response = await axios.get(jobUrl, {
            headers: headers,
            timeout: 15000
        });

        console.log('Received response from Ashby. Status:', response.status);
        const html = response.data;
        const $ = cheerio.load(html);
        
        // Find the script tag containing window.__appData
        const scriptContent = $('script').map((i, el) => $(el).html()).get()
            .find(content => content && content.includes('window.__appData'));
        
        if (!scriptContent) {
            console.warn('Could not find window.__appData in script tags');
            return null;
        }

        // Extract the JSON object from the script content
        const jsonMatch = scriptContent.match(/window\.__appData\s*=\s*({[\s\S]*?});/);
        if (!jsonMatch) {
            console.warn('Could not extract JSON from window.__appData');
            return null;
        }

        try {
            const appData = JSON.parse(jsonMatch[1]);
            console.log('Successfully parsed window.__appData');

            // Try to get the job description from the parsed data
            const jobDescription = appData?.posting?.descriptionPlainText || 
                                 appData?.posting?.descriptionHtml;

            if (!jobDescription) {
                console.warn('Could not find job description in parsed data');
                return null;
            }

            // If we got HTML, convert it to text
            let jobDescriptionText = jobDescription;
            if (jobDescription.includes('<')) {
                const $desc = cheerio.load(jobDescription);
                jobDescriptionText = $desc.text();
            }

            // Clean up the text
            const lines = jobDescriptionText.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            // Filter out common sections we don't want
            const filteredLines = lines.filter(line => {
                const lowerLine = line.toLowerCase();
                return !(
                    lowerLine.includes('compensation range') ||
                    lowerLine.includes('salary range') ||
                    lowerLine.includes('$') ||
                    lowerLine.includes('benefits') ||
                    lowerLine.includes('why you\'ll love working here') ||
                    lowerLine.includes('equal opportunity') ||
                    lowerLine.includes('diversity') ||
                    lowerLine.includes('privacy policy') ||
                    lowerLine.includes('fair chance') ||
                    lowerLine.includes('reasonable accommodations')
                );
            });

            jobDescriptionText = filteredLines.join('\n');
            jobDescriptionText = jobDescriptionText.replace(/\n{3,}/g, '\n\n');
            console.log('Final text length after filtering:', jobDescriptionText.length);

            return jobDescriptionText.trim();
        } catch (parseError) {
            console.error('Error parsing JSON from window.__appData:', parseError);
            return null;
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Axios error fetching URL ${jobUrl}:`, {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                headers: error.response?.headers
            });
        } else {
            console.error(`An unexpected error occurred while processing ${jobUrl}:`, error);
        }
        return null;
    }
}

/**
 * Extracts the job description from a Jobvite job posting.
 * @param {string} jobUrl - The URL of the Jobvite job posting.
 * @returns {Promise<string|null>} The job description text or null if an error occurs or content not found.
 */
async function extractJobviteJobDescription(jobUrl) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    };

    try {
        const response = await axios.get(jobUrl, {
            headers: headers,
            timeout: 15000
        });

        const html = response.data;
        const $ = cheerio.load(html);
        
        // Jobvite job descriptions are in a div with class="jv-job-detail-description"
        const contentDiv = $('.jv-job-detail-description');

        if (contentDiv.length > 0) {
            // Handle <br> tags and block elements
            contentDiv.find('br').replaceWith('\n');
            contentDiv.find('p, div, li, ul, ol, h1, h2, h3, h4, h5, h6, blockquote, pre, hr, table').each((i, el) => {
                $(el).prepend('\n');
                $(el).append('\n');
            });

            let jobDescriptionText = contentDiv.text();
            const lines = jobDescriptionText.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            // Filter out common sections we don't want
            const filteredLines = lines.filter(line => {
                const lowerLine = line.toLowerCase();
                return !(
                    lowerLine.includes('compensation') ||
                    lowerLine.includes('salary range') ||
                    lowerLine.includes('$') ||
                    lowerLine.includes('benefits') ||
                    lowerLine.includes('equal opportunity') ||
                    lowerLine.includes('diversity') ||
                    lowerLine.includes('privacy policy') ||
                    lowerLine.includes('fair chance') ||
                    lowerLine.includes('reasonable accommodations') ||
                    lowerLine.includes('why work at') ||
                    lowerLine.includes('professional development') ||
                    lowerLine.includes('professional growth')
                );
            });

            jobDescriptionText = filteredLines.join('\n');
            jobDescriptionText = jobDescriptionText.replace(/\n{3,}/g, '\n\n');

            return jobDescriptionText.trim();
        } else {
            console.warn(`Warning: Could not find the job description div (class='jv-job-detail-description') for URL: ${jobUrl}`);
            return null;
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Axios error fetching URL ${jobUrl}: ${error.message}`);
            if (error.response) {
                console.error(`Status: ${error.response.status}`);
            }
        } else {
            console.error(`An unexpected error occurred while processing ${jobUrl}: ${error.message}`);
        }
        return null;
    }
}

/**
 * Extracts job description from a job posting URL.
 * @param {string} jobUrl - The URL of the job posting.
 * @returns {Promise<string|null>} The job description text or null if an error occurs or content not found.
 */
async function extractJobDescription(jobUrl) {
    try {
        const url = new URL(jobUrl);
        
        if (url.hostname.includes('greenhouse.io')) {
            return await extractGreenhouseJobDescription(jobUrl);
        } else if (url.hostname.includes('lever.co')) {
            return await extractLeverJobDescription(jobUrl);
        } else if (url.hostname.includes('jobs.ashbyhq.com')) {
            return await extractAshbyJobDescription(jobUrl);
        } else if (url.hostname.includes('jobs.jobvite.com')) {
            return await extractJobviteJobDescription(jobUrl);
        } else {
            throw new Error('Unsupported job board URL');
        }
    } catch (error) {
        console.error(`Error processing URL ${jobUrl}: ${error.message}`);
        return null;
    }
}

module.exports = { extractJobDescription }; 