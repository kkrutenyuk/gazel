document.addEventListener('DOMContentLoaded', function () {
  console.log('[Gazel] Script initialized');

  const form = document.querySelector('form');
  const urlField = document.querySelector('.url-field');
  const urlButton = document.querySelector('.url-button');

  console.log('[Gazel] Form elements found:', {
    form: !!form,
    field: !!urlField,
    button: !!urlButton
  });

  // Fix insecure form action
  if (form && form.getAttribute('action')?.startsWith('http://')) {
    form.setAttribute('action', form.getAttribute('action').replace('http://', 'https://'));
    console.log('[Gazel] Fixed insecure form action target');
  }

  // Set input attributes to prevent autofill and override Webflow validation
  if (urlField) {
    urlField.setAttribute('autocomplete', 'off');
    urlField.setAttribute('autocorrect', 'off');
    urlField.setAttribute('autocapitalize', 'off');
    urlField.setAttribute('spellcheck', 'false');
    urlField.setAttribute('type', 'text');
  }

  // Disable button initially
  if (urlButton) {
    urlButton.style.opacity = '0.5';
    urlButton.style.pointerEvents = 'none';
  }

  // URL validation helper
  function isValidURL(string) {
    if (!string) return false;
    const domainPattern = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    if (!/^https?:\/\//i.test(string)) {
      if (!domainPattern.test(string)) return false;
      string = 'http://' + string;
    }
    try {
      const url = new URL(string);
      return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.') && url.hostname.length > 3;
    } catch (_) {
      return false;
    }
  }

  // Function to get or create a short persistent user identifier
    function getShortUserIdentifier() {
        // Generate a shorter unique ID using timestamp and random values
        // Format: timestamp (base36) + short random string (8 chars)
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 10);
        let userId = timestamp + randomPart;
        return userId;
    }

// Function to analyze SEO using loading page approach
function analyzeSEOViaForm(url) {
  console.log('[Gazel] Starting analysis for URL:', url);
  
  // Ensure URL has proper format - ALWAYS use HTTPS to prevent mixed content warnings
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
    console.log('[Gazel] URL reformatted to include https:', url);
  } else if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
    console.log('[Gazel] URL changed from http to https:', url);
  }
  
  // Generate or retrieve a short user identifier
  let userId = getShortUserIdentifier();
  console.log('[Gazel] Using user identifier:', userId);
  
  // Store the URL and user ID in sessionStorage
  sessionStorage.setItem('analyzedUrl', url);
  sessionStorage.setItem('userId', userId);
  sessionStorage.setItem('analysisStartTime', Date.now());
  console.log('[Gazel] URL and user ID stored in sessionStorage');
  
  const dataToEncode = JSON.stringify({id: userId, url: url});
  let encodedData = btoa(dataToEncode);
  // Make sure to replace all potential '=' at the end
  encodedData = encodedData.replace(/=+$/, function(match) {
  return '_'.repeat(match.length);
  });
  
  // Create the Stripe checkout URL with the encoded reference ID
  // Note: The Stripe link part may change in the final version

  // original stripe url
  const stripeCheckoutUrl = `https://buy.stripe.com/eVqeVd2R75Pj4t0eWNeUU02?client_reference_id=${encodedData}`;

  //test stripe url
  // const stripeCheckoutUrl = `https://buy.stripe.com/test_4gw7szfwOeCq3pS9AA?client_reference_id=${encodedData}`;
  console.log('[Gazel] Stripe checkout URL:', stripeCheckoutUrl);
  
  // Store the Stripe URL in sessionStorage
  sessionStorage.setItem('stripeCheckoutUrl', stripeCheckoutUrl);
  
  // Redirect to loading page
  console.log('[Gazel] Redirecting to loading page...');
  window.location.href = '/loading?url=' + encodeURIComponent(url);
}

// Function to handle the retrieved data on the receiving end (if needed)
function decodeStripeReferenceId(encodedId) {
  // Add back any missing padding if needed
  let paddedId = encodedId;
  while (paddedId.length % 4 !== 0) {
    paddedId += '_';
  }
  
  // Replace '_' back to '=' for decoding
  const base64Id = paddedId.replace(/_/g, '=');
  
  try {
    // Decode the Base64 string
    const jsonString = atob(base64Id);
    // Parse the JSON
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('[Gazel] Error decoding reference ID:', error);
    return null;
  }
}

  // Handle input changes
  if (urlField) {
    urlField.addEventListener('input', function () {
      const inputValue = this.value.trim();
      const parent = this.closest('.url-input_area');
      if (parent) {
        parent.classList.toggle('has-content', !!inputValue);
      }

      if (urlButton) {
        if (isValidURL(inputValue)) {
          urlButton.style.opacity = '1';
          urlButton.style.pointerEvents = 'auto';
          urlField.setCustomValidity('');
          urlButton.classList.add('url-valid');
        } else {
          urlButton.style.opacity = '0.5';
          urlButton.style.pointerEvents = 'none';
          urlField.setCustomValidity(inputValue ? 'Please enter a valid URL' : '');
          urlButton.classList.remove('url-valid');
        }
      }
    });
  }

  // Button click handler
  if (urlButton) {
    urlButton.addEventListener('click', function (e) {
      e.preventDefault();
      const url = urlField?.value.trim() || '';
      if (isValidURL(url)) {
        analyzeSEOViaForm(url);
      } else {
        urlField.setCustomValidity('Please enter a valid URL');
        urlField.reportValidity();
      }
    });
  }

  // Form submit handler
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const url = urlField?.value.trim() || '';
      if (isValidURL(url)) {
        analyzeSEOViaForm(url);
      } else {
        urlField.setCustomValidity('Please enter a valid URL');
        urlField.reportValidity();
      }
    });
  }

  // The rest of your script (loading page, results, simulated data, etc.) remains unchanged
  // You can paste it below this block or keep it as-is if already present
});

  
  // ===== LOADING PAGE CODE =====
  if (window.location.pathname.includes('/loading')) {
    console.log('[Gazel] On loading page, initializing...');
    setTimeout(loadingPageInit, 100); // Short delay to ensure DOM is ready
  }
  
  // ===== RESULTS PAGE CODE =====
  if (window.location.pathname.includes('/results') && !window.location.pathname.includes('/results-pre')) {
    console.log('[Gazel] On results page, initializing...');
    setTimeout(resultsPageInit, 100); // Short delay to ensure DOM is ready
  }
  
  // ===== RESULTS PRE PAGE CODE =====
  if (window.location.pathname.includes('/results-pre')) {
    console.log('[Gazel] On results-pre page, initializing...');
    setTimeout(resultsPrePageInit, 100); // Short delay to ensure DOM is ready
  }
  
  // Loading page initialization
  function loadingPageInit() {
    console.log('[Gazel] Loading page initialization started');
    
    // Get the URL from sessionStorage or from query parameter
    let analyzedUrl = sessionStorage.getItem('analyzedUrl') || '';
    
    // If not in sessionStorage, try to get from URL params
    if (!analyzedUrl) {
      const urlParams = new URLSearchParams(window.location.search);
      analyzedUrl = urlParams.get('url') || '';
      if (analyzedUrl) {
        sessionStorage.setItem('analyzedUrl', analyzedUrl);
      }
    }
    
    console.log('[Gazel] Analyzed URL for display:', analyzedUrl);
    
    // Display the analyzed URL on the loading page
    updateUrlDisplay(analyzedUrl);
    
    
    // Wait minimum time before redirecting (for perceived loading experience)
    const loadStartTime = Date.now();
    const minLoadTime = 5000; // 5 second minimum loading time
    
    // Function to handle redirection with minimum loading time
    function redirectAfterMinTime() {
      const elapsedTime = Date.now() - loadStartTime;
      const remainingTime = Math.max(0, minLoadTime - elapsedTime);
      
      // Wait for the minimum loading time before redirecting
      setTimeout(() => {
        window.location.href = '/results-pre';
      }, remainingTime);
    }
    
    // Start API request or use simulated data
    startSEOAnalysisWithProxy(analyzedUrl)
      .then(() => redirectAfterMinTime())
      .catch(error => {
          console.error('[Gazel API] Error:', error);
          navigateToError();
      });
  }
  
  async function startSEOAnalysisWithProxy(url) {
  const userId = sessionStorage.getItem('userId');
  console.log('[Gazel API] Triggering analysis for:', url);

  // Trigger analysis (no response expected)
  await fetch('https://api.gazel.ai/api/v1/seo_analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, id: userId })
  });
}

  
  // Results Pre-page initialization
function resultsPrePageInit() {
    const logo = document.querySelector('.logo');
    logo.addEventListener('click', function (e) {
        window.location.replace('/');
    });

    // Get the URL from sessionStorage
    let analyzedUrl = sessionStorage.getItem('analyzedUrl') || '';

    // Display the analyzed URL
    updateUrlDisplay(analyzedUrl);

    // Get the Stripe checkout URL from sessionStorage
    const stripeCheckoutUrl = sessionStorage.getItem('stripeCheckoutUrl');

    // Set up both payment buttons to redirect to Stripe
    const paymentButton1 = document.getElementById('payment-button-1');
    const paymentButton2 = document.getElementById('payment-button-2');

    // Function to handle button click
    const handlePaymentClick = function (e) {
        e.preventDefault();
        console.log('[Gazel] Payment button clicked, redirecting to Stripe:', stripeCheckoutUrl);
        window.location.href = stripeCheckoutUrl;
    };

    // Add event listener to first payment button if it exists
    if (paymentButton1 && stripeCheckoutUrl) {
        paymentButton1.addEventListener('click', handlePaymentClick);
        console.log('[Gazel] Added click handler to payment button 1');
    }

    // Add event listener to second payment button if it exists
    if (paymentButton2 && stripeCheckoutUrl) {
        paymentButton2.addEventListener('click', handlePaymentClick);
        console.log('[Gazel] Added click handler to payment button 2');
    }

    updatePreElementsFromRealAPI();
}
  
  // Function to update URL display on loading page
  function updateUrlDisplay(url) {
    // Find all elements with ID 'url-text'
    const urlTextElements = document.querySelectorAll('#url-text');
    
    if (urlTextElements.length > 0) {
      // Update all instances of url-text elements
      urlTextElements.forEach(element => {
        element.textContent = url;
      });
      
      console.log('[Gazel] Updated URL display elements');
    } else {
      console.log('[Gazel] No URL text elements found, searching for templates');
      
      // Fallback: Search for elements containing {url} template
      document.querySelectorAll('*').forEach(el => {
        if (el.childNodes && el.childNodes.length > 0) {
          el.childNodes.forEach(node => {
            if (node.nodeType === 3 && node.textContent && node.textContent.includes('{url}')) {
              node.textContent = node.textContent.replace('{url}', url);
            }
          });
        }
      });
    }
  }
  
  
  // Results page initialization
function resultsPageInit() {
    const logo = document.querySelector('.logo');
    logo.addEventListener('click', function (e) {
        window.location.replace('/');
    });

    const urlParams = new URLSearchParams(window.location.search);

    //If userId not null it means that user was redirected from email
    const userId = urlParams.get('userId');
    if (userId) {
        sessionStorage.setItem('userId', userId);
    }

    // Get the URL from sessionStorage or url
    let analyzedUrl = sessionStorage.getItem('analyzedUrl');
    if (!analyzedUrl) {
        const param = urlParams.get('analyzedUrl');
        if (param) {
            analyzedUrl = decodeURIComponent(param);
            sessionStorage.setItem('analyzedUrl', analyzedUrl);
        }
    }

    //remove params from url
    const baseUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, baseUrl);

    // Display the analyzed URL
    updateUrlDisplay(analyzedUrl ?? '');

    checkLegalityOfBeingOnResultsScreen().then(() => {
        updateElementsFromRealAPI();
    });

    // Check for hash in URL to activate correct tab
    if (window.location.hash) {
        const tabId = window.location.hash.substring(1);
        activateTab(tabId);
    }
}
  
  // Function to activate the appropriate tab
  function activateTab(tabId) {
    // Find the tab link
    const tabLink = document.querySelector(`a[href="#${tabId}"]`);
    if (tabLink) {
      // Remove current class from all tabs
      document.querySelectorAll('.tab-wrapper').forEach(tab => {
        tab.classList.remove('w--current');
      });
      
      // Add current class to the selected tab
      tabLink.classList.add('w--current');
      
      // Show the corresponding section
      document.querySelectorAll('section').forEach(section => {
        section.style.display = section.id === tabId ? 'flex' : 'none';
      });
    }
  }

 // Update elements(pre result) with API response data
async function updatePreElementsFromRealAPI() {
    // Fetch results
    const userId = sessionStorage.getItem('userId');
    const resultsPreRes = await fetch('https://api.gazel.ai/api/v1/pre_results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
    });

    if (!resultsPreRes.ok) {
        console.error('[Gazel] Error parsing API results-pre');
        navigateToError();
    }

    const results = await resultsPreRes.json();
    if (!results.data["overall_score"] || results.data["overall_score"] == 0) {
        console.error(`[Gazel] no responce data`);
        navigateToError();
        return;
    }
    // Display preview data from the API response
    updateScore('score-overall', results.data["overall_score"]);
    updateScore('score-audience', results.data["audience_score"]);
    updateGraphs('circle-progress-audience', results.data["audience_score"]);

    updateScore('score-messaging', results.data["messaging_score"]);
    updateGraphs('circle-progress-messaging', results.data["messaging_score"]);

    updateScore('score-credibility', results.data["credibility_score"]);
    updateGraphs('circle-progress-credibility', results.data["credibility_score"]);

    updateScore('score-ux', results.data["ux_score"]);
    updateGraphs('circle-progress-ux', results.data["ux_score"]);
}

async function checkLegalityOfBeingOnResultsScreen() {
    const userId = sessionStorage.getItem('userId');
    // Check payment status
    const paymentRes = await fetch('https://api.gazel.ai/api/v1/checkpayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
    });


    const paid = await paymentRes.json();
    if (paid !== 'paid') {
        window.location.href = '/results-pre';
    }
    return;
}
async function updateElementsFromRealAPI(apiResponse) {
    // Fetch results
    const userId = sessionStorage.getItem('userId');
    let resultsRes = await fetch('https://api.gazel.ai/api/v1/full_results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
    });
    if (!resultsRes.ok) {
        console.error('[Gazel] Error parsing API results');
        navigateToError();
    }

    const results = await resultsRes.json();

    // Check for data structure
    if (!results || !results.data) {
        console.error('[Gazel] Invalid API response structure:', results);
        navigateToError();
        return;
    }

    const data = results.data;

    // Check for required categories
    const requiredCategories = ["Target_Audience", "Messaging", "Credibility", "User_Experience"];
    for (const category of requiredCategories) {
        if (!data[category]) {
            console.error(`[Gazel] Missing category in API response: ${category}`);
            navigateToError();
            return;
        }
    }

    // Calculate overall score (average of all scores)
    const overallScore = Math.round(
        (
            data["Target_Audience"]["audience_score"] +
            data["Messaging"]["messaging_score"] +
            data["Credibility"]["credibility_score"] +
            data["User_Experience"]["ux_score"]
        )
        / 4);

    if (!overallScore || overallScore == 0) {
        console.error(`[Gazel] no responce data`);
        navigateToError();
        return;
    }
    // Update scores
    updateScore('score-overall', overallScore);

    updateScore('score-audience', data["Target_Audience"]["audience_score"]);
    updateGraphs('circle-progress-audience', data["Target_Audience"]["audience_score"]);

    updateScore('score-messaging', data["Messaging"]["messaging_score"]);
    updateGraphs('circle-progress-messaging', data["Messaging"]["messaging_score"]);

    updateScore('score-credibility', data["Credibility"]["credibility_score"]);
    updateGraphs('circle-progress-credibility', data["Credibility"]["credibility_score"]);

    updateScore('score-ux', data["User_Experience"]["ux_score"]);
    updateGraphs('circle-progress-ux', data["User_Experience"]["ux_score"]);

    // Update audience demographics
    updateElementContent('audience-men', data["Target_Audience"]["audience_men"] + '%');
    updateElementContent('audience-women', data["Target_Audience"]["audience_women"] + '%');

    // Find the dominant age group (with highest percentage)
    if (data["Target_Audience"]["audience_age_groups"]) {
        const ageGroups = data["Target_Audience"]["audience_age_groups"];
        let maxPercentage = 0;
        let dominantAgeGroup = '';

        for (const [ageRange, percentage] of Object.entries(ageGroups)) {
            if (percentage > maxPercentage) {
                maxPercentage = percentage;
                dominantAgeGroup = getPreferredAgeGroupByJsonKey(ageRange);
            }
        }

        updateElementContent('audience-age-group', dominantAgeGroup);
    }

    // Update social media percentages
    if (data["Target_Audience"]["audience_social_platforms"]) {
        const platforms = data["Target_Audience"]["audience_social_platforms"];
        updateElementContent('audience-facebook', platforms["facebook"] + '%');
        updateElementContent('audience-instagram', platforms["instagram"] + '%');
        updateElementContent('audience-x', platforms["x_com"] + '%');
        updateElementContent('audience-reddit', platforms["reddit"] + '%');
        updateElementContent('audience-linkedin', platforms["linkedin"] + '%');
    }

    // Update summaries
    updateElementContent('audience-summary', data["Target_Audience"]["audience_summary"]);
    updateElementContent('messaging-summary', data["Messaging"]["messaging_summary"]);
    updateElementContent('credibility-summary', data["Credibility"]["credibility_summary"]);
    updateElementContent('ux-summary', data["User_Experience"]["ux_summary"]);

    // Update explanation points
    updateExplanationPoints('audience', data["Target_Audience"]["audience_explanation"]);
    updateExplanationPoints('messaging', data["Messaging"]["messaging_explanation"]);
    updateExplanationPoints('credibility', data["Credibility"]["credibility_explanation"]);
    updateExplanationPoints('ux', data["User_Experience"]["ux_explanation"]);
}
  
 // Update explanation points for each category
 function updateExplanationPoints(category, explanations) {
  if (!explanations || !Array.isArray(explanations)) return;
  
  // Update up to 3 points for each category
  for (let i = 0; i < Math.min(explanations.length, 5); i++) {
    const pointId = `${category}-p${i+1}`;
    updateElementContent(pointId, explanations[i]);
  }
}


// Helper function to update element content if it exists
function updateElementContent(elementId, content) {
  if (!elementId || content === undefined || content === null) return;
  
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = content;
  }
}

// Helper function to update score elements
function updateScore(elementId, score) {
  if (!elementId || score === undefined || score === null) return;
  
  // Find all elements with the matching ID
  const elements = document.querySelectorAll('#' + elementId);
  if (!elements.length) return;
  
  // Format the score (round to nearest integer)
  const formattedScore = typeof score === 'number' ? Math.round(score) : 0;
  
  // Update all matching elements
  elements.forEach(element => {
    element.textContent = formattedScore;
  });
}


// Helper function to update graphs elements
function updateGraphs(elementId, score) {
    if (!elementId || score === undefined || score === null) return;

    // Find all elements with the matching ID
    const elements = document.querySelectorAll('#' + elementId);
    if (!elements.length) return;

    // Format the score (round to nearest integer)
    const formattedScore = typeof score === 'number' ? Math.round(score) : 0;
    // Update all matching elements
    if (formattedScore > 0) {
        elements.forEach(element => {
            element.setAttribute("stroke-dasharray", formattedScore.toString() + ", 100");
            element.setAttribute("stroke-opacity", "1");
			
			element.style.animation = "none";
			element.offsetHeight; 
			element.style.animation = "progress 1s ease-out forwards";
        });
    }
}


// Helper function for getting preferred age group by json key
function getPreferredAgeGroupByJsonKey(preferredAgeKey) {
    const match = preferredAgeKey.match(/^age_(\d+)(?:_(\d+|plus))?$/);
    if (!match) return preferredAgeKey;

    const from = match[1];
    const to = match[2];

    if (to === 'plus') {
        return `${from}+`;
    } else if (to) {
        return `${from}-${to}`;
    } else {
        return from;
    }
}

function navigateToError() {
    window.location.href = '/error';
}

