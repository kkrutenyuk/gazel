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
  // Try to get from localStorage first (most persistent)
  let userId = localStorage.getItem('gazel_user_id');
  
  // If not found in localStorage, check sessionStorage (fallback)
  if (!userId) {
    userId = sessionStorage.getItem('gazel_user_id');
  }
  
  // If still not found, create a new one (shorter format)
  if (!userId) {
    // Generate a shorter unique ID using timestamp and random values
    // Format: timestamp (base36) + short random string (8 chars)
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    userId = timestamp + randomPart;
    
    // Store in both localStorage and sessionStorage for persistence
    try {
      localStorage.setItem('gazel_user_id', userId);
    } catch (e) {
      console.log('[Gazel] Unable to use localStorage, falling back to sessionStorage only');
    }
    sessionStorage.setItem('gazel_user_id', userId);
  }
  
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
  sessionStorage.setItem('apiEndpoint', 'https://api.gazel.ai/api/v1/seo_analyze');
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
  // const stripeCheckoutUrl = `https://buy.stripe.com/4gw6p4dJuei17ba6op?client_reference_id=${encodedData}`;

  //test stripe url
  const stripeCheckoutUrl = `https://buy.stripe.com/test_4gw7szfwOeCq3pS9AA?client_reference_id=${encodedData}`;
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
    
    // Create and add spinner animation
    createAndAddSpinner();
    
    // Wait minimum time before redirecting (for perceived loading experience)
    const loadStartTime = Date.now();
    const minLoadTime = 5000; // 5 second minimum loading time
    
    // Function to handle redirection with minimum loading time
    function redirectAfterMinTime(isSuccess, data) {
      const elapsedTime = Date.now() - loadStartTime;
      const remainingTime = Math.max(0, minLoadTime - elapsedTime);
      
      if (isSuccess) {
        // Store real API data in session storage
        sessionStorage.setItem('seoAnalysisResults', JSON.stringify(data));
        sessionStorage.setItem('usingRealData', 'true');
      } else {
        // Store error in session storage
        sessionStorage.setItem('analysisError', data.toString());
        sessionStorage.setItem('usingRealData', 'false');
      }
      
      // Wait for the minimum loading time before redirecting
      setTimeout(() => {
        window.location.href = '/results-pre';
      }, remainingTime);
    }
    
    // Start API request or use simulated data
    startSEOAnalysisWithProxy(analyzedUrl)
      .then(data => redirectAfterMinTime(true, data))
      .catch(error => {
        console.error('[Gazel API] Error:', error);
        redirectAfterMinTime(false, error);
      });
  }
  
  async function startSEOAnalysisWithProxy(url) {
  const userId = sessionStorage.getItem('userId') || getShortUserIdentifier();
  console.log('[Gazel API] Triggering analysis for:', url);

  // Trigger analysis (no response expected)
  await fetch('https://api.gazel.ai/api/v1/seo_analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, id: userId })
  });

  // Step 2: Check payment status
  const paymentRes = await fetch('https://api.gazel.ai/api/v1/checkpayment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId })
  });

  const { paid } = await paymentRes.json() === "paid";
  console.log('[Gazel API] Payment status:', paid ? 'PAID' : 'NOT PAID');

  // Step 3: Fetch results

    const resultsRes = await fetch('https://api.gazel.ai/api/v1/pre_results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId })
  });

  if (!resultsRes.ok) {
    throw new Error(`Failed to fetch results: ${resultsRes.status}`);
  }

  const results = await resultsRes.json();
  return results;
}

  
  // Results Pre-page initialization
function resultsPrePageInit() {
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

    // Optional: If you want to display preview data or partial results
    // on this page, you can access seoAnalysisResults from sessionStorage here
    const resultsJson = sessionStorage.getItem('seoAnalysisResults');
    if (resultsJson) {
        try {
            const apiResponse = await fetch('https://api.gazel.ai/api/v1/pre_results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId })
            });
            // Display preview data from the API response
            updateScore('score-overall', apiResponse.data["overall_score"]);
            updateScore('score-audience', apiResponse.data["audience_score"]);
            updateScore('score-messaging', apiResponse.data["messaging_score"]);
            updateScore('score-credibility', apiResponse.data["credibility_score"]);
            updateScore('score-ux', apiResponse.data["ux_score"]);
            // For example, show overall score or a summary
        } catch (error) {
            console.error('Error parsing results for preview:', error);
        }
    }
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
  
  // Function to create and add spinner animation to loading page
  function createAndAddSpinner() {
    console.log('[Gazel] Creating spinner animation');
    
    // Check if spinner already exists
    if (document.querySelector('.gazel-spinner')) {
      console.log('[Gazel] Spinner already exists, skipping creation');
      return;
    }
    
    // Create spinner element
    const spinner = document.createElement('div');
    spinner.className = 'gazel-spinner';
    spinner.style.display = 'block';
    spinner.style.margin = '20px auto';
    
    // Add spinner HTML
    spinner.innerHTML = `
      <div class="clock-spinner">
        <div class="clock-spinner-line" style="transform: rotate(0deg)"></div>
        <div class="clock-spinner-line" style="transform: rotate(45deg)"></div>
        <div class="clock-spinner-line" style="transform: rotate(90deg)"></div>
        <div class="clock-spinner-line" style="transform: rotate(135deg)"></div>
        <div class="clock-spinner-line" style="transform: rotate(180deg)"></div>
        <div class="clock-spinner-line" style="transform: rotate(225deg)"></div>
        <div class="clock-spinner-line" style="transform: rotate(270deg)"></div>
        <div class="clock-spinner-line" style="transform: rotate(315deg)"></div>
      </div>
    `;
    
    // Add spinner CSS
    if (!document.getElementById('gazel-spinner-styles')) {
      const style = document.createElement('style');
      style.id = 'gazel-spinner-styles';
      style.textContent = `
        .gazel-spinner {
          text-align: center;
          padding: 20px;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          z-index: 9999;
        }
        .clock-spinner {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto;
        }
        .clock-spinner-line {
          position: absolute;
          width: 4px;
          height: 20px;
          background-color: #3C3C3C;
          top: 8px;
          left: 50%;
          margin-left: -2px;
          transform-origin: center 32px;
          opacity: 0.2;
          animation: clock-fade 0.8s linear infinite;
        }
        .clock-spinner-line:nth-child(1) { animation-delay: 0s; }
        .clock-spinner-line:nth-child(2) { animation-delay: 0.1s; }
        .clock-spinner-line:nth-child(3) { animation-delay: 0.2s; }
        .clock-spinner-line:nth-child(4) { animation-delay: 0.3s; }
        .clock-spinner-line:nth-child(5) { animation-delay: 0.4s; }
        .clock-spinner-line:nth-child(6) { animation-delay: 0.5s; }
        .clock-spinner-line:nth-child(7) { animation-delay: 0.6s; }
        .clock-spinner-line:nth-child(8) { animation-delay: 0.7s; }
        @keyframes clock-fade {
          0%, 12.5%, 100% { opacity: 0.2; }
          6.25% { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Add spinner to loading-wrap element (or fallback containers)
    const loadingWrap = document.querySelector('.loading-wrap');
    
    if (loadingWrap) {
      loadingWrap.appendChild(spinner);
      console.log('[Gazel] Added spinner to loading-wrap');
    } else {
      // Try alternate containers
      const possibleContainers = [
        document.querySelector('.loading-container'),
        document.querySelector('main'),
        document.querySelector('.main-content'),
        document.querySelector('.section'),
        document.querySelector('.container'),
        document.body
      ];
      
      let spinnerAdded = false;
      
      for (const container of possibleContainers) {
        if (container) {
          container.appendChild(spinner);
          console.log('[Gazel] Added spinner to fallback container:', container);
          spinnerAdded = true;
          break;
        }
      }
      
      // Last resort - add directly to body with fixed positioning
      if (!spinnerAdded) {
        document.body.appendChild(spinner);
        spinner.style.position = 'fixed';
        spinner.style.top = '50%';
        spinner.style.left = '50%';
        spinner.style.transform = 'translate(-50%, -50%)';
        console.log('[Gazel] Added spinner directly to body');
      }
    }
  }
  
  // Create simulated API response for development/testing
function createSimulatedAPIResponse(url) {
    // Generate random scores between 65-95
    const getRandomScore = () => Math.floor(Math.random() * 30) + 65;
    const getRandomPercentage = () => Math.floor(Math.random() * 60) + 20; // 20-80%

    return {
        success: true,
        message: "Analysis completed successfully (simulated)",
        data: {
            "Target_Audience": {
                "audience_score": getRandomScore(),
                "audience_summary": "Your site effectively targets your audience but could be more specific to industry verticals.",
                "audience_explanation": [
                    "The website's minimalistic design ensures low visual clutter, contributing to a focused user experience. However, the lack of prominent trust elements like customer reviews or media badges slightly undermines credibility. For example, the absence of third-party logos or certifications may reduce perceived authority. While the content is concise, deeper engagement metrics like session duration could be improved. The straightforward hierarchy aids navigation but may oversimplify complex information.",
                    "Demographic alignment is partially achieved, with imagery and messaging catering to a broad audience. However, specific age groups or niches may find the content too generic. The site avoids repetitive sections, maintaining user interest, but could benefit from more dynamic content updates. Mobile optimization is strong, yet some users might expect more personalized features. The balance between new and returning visitors suggests steady growth but not strong loyalty.",
                    "Trust-building elements are underutilized, with few customer testimonials or media mentions highlighted. Security badges or partnerships are not prominently displayed, which could affect user confidence. The lack of detailed case studies or data-driven success metrics limits social proof. While the site is functional, adding trust signals would enhance credibility. Users seeking verified information might seek additional reassurance elsewhere.",
                    "Content relevance is mixed, with core messaging aligning to general user needs but lacking depth for specific queries. The absence of niche-specific examples or tailored solutions may reduce engagement. While the site avoids fluff, some sections could benefit from more detailed explanations. Users expecting highly specialized information might find the content too surface-level. Improving topical depth could increase time-on-page metrics.",
                    "User experience is streamlined but lacks advanced customization options. The clean layout supports ease of use but may feel impersonal to some audiences. Spacing and typography are consistent, though visual hierarchy could better guide user attention. Images are professional but generic, missing opportunities for audience-specific relatability. Enhancing interactive elements or personalized content paths could boost engagement."
                ],
                "audience-executive_summary": "While functionally effective, the website would benefit from enhanced trust signals, demographic-specific content, and deeper engagement features to improve audience alignment and retention.",
                "audience_women": getRandomPercentage(),
                "audience_men": 100 - getRandomPercentage(), // Ensures male + female = 100%
                "audience_age_groups": {
                    "age_18_24": Math.floor(Math.random() * 25),
                    "age_25_34": Math.floor(Math.random() * 40),
                    "age_35_44": Math.floor(Math.random() * 30),
                    "age_45_plus": Math.floor(Math.random() * 25)
                },
                "audience_social_platforms": {
                    "Facebook": 34,
                    "Instagram": 28,
                    "x_com": 18,
                    "reddit": 12,
                    "linkedin": 8
                },
            },
            "Messaging": {
                "messaging_score": getRandomScore(),
                "messaging_summary": "Clear primary value proposition with opportunity to strengthen feature-to-benefit connections.",
                "messaging_explanation": [
                    "Your headline clearly communicates the core problem you solve, though secondary headlines sometimes focus on features rather than outcomes.",
                    "Case studies effectively demonstrate real-world results, but pricing page lacks sufficient social proof elements.",
                    "Product screenshots effectively showcase functionality, but could better highlight specific use cases."
                ]
            },
            "Credibility": {
                "credibility_score": getRandomScore(),
                "credibility_summary": "Strong social proof with customer logos and testimonials, but technical credibility could be enhanced.",
                "credibility_explanation": [
                    "Client logos from recognized brands build immediate trust, particularly in the enterprise sector.",
                    "Customer testimonials include good quantifiable results, but could feature more diverse industry representation.",
                    "Security badges and certifications appear below the fold rather than prominently in signup flows."
                ]
            },
            "User_Experience": {
                "ux_score": getRandomScore(),
                "ux_summary": "Clean navigation and visual hierarchy, with some mobile optimization opportunities.",
                "ux_explanation": [
                    "Desktop experience features intuitive navigation and clear CTAs with proper visual hierarchy.",
                    "Mobile menu requires optimization as dropdown items are difficult to tap accurately on smaller screens.",
                    "Form fields lack inline validation which creates friction in signup and contact forms."
                ]
            }
        }
    };
}
  
  // Results page initialization
  function resultsPageInit() {
    // Get the URL from sessionStorage
    const analyzedUrl = sessionStorage.getItem('analyzedUrl') || '';
    
    // Display the analyzed URL
    updateUrlDisplay(analyzedUrl);
    
    // Check if we have real API results
    const usingRealData = sessionStorage.getItem('usingRealData') === 'true'; 
    if (usingRealData) {
      try {
        updateElementsFromRealAPI();
      } catch (error) {
        console.error('[Gazel] Error parsing API results:', error);
        simulateScores(); // Fallback to simulation
      }
    } else {
      // No real data or error occurred - use simulated data
      simulateScores();
    }
    
    // Double-check if notification is needed
    if (sessionStorage.getItem('usingRealData') !== 'true' || 
        sessionStorage.getItem('usedFallbackMethod') === 'true') {
      // Wait a short time to ensure the DOM is updated
      setTimeout(addSimulatedDataNotice, 500);
    }
    
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



  // Update elements with API response data
async function updateElementsFromRealAPI(apiResponse) {
    // Fetch results
    let resultsRes;
    if (!apiResponse) {
        const userId = sessionStorage.getItem('userId') || getShortUserIdentifier();
        resultsRes = await fetch('https://api.gazel.ai/api/v1/full_results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId })
        });
    }
    else {
        resultsRes = apiResponse;
    }
    if (!resultsRes.ok) {
        throw new Error(`Failed to fetch results: ${resultsRes.status}`);
    }

    const results = await resultsRes.json();

    // Check for data structure
    if (!results || !results.data) {
        console.error('[Gazel] Invalid API response structure:', results);
        simulateScores();
        return;
    }

    const data = results.data;

    // Check for required categories
    const requiredCategories = ["Target_Audience", "Messaging", "Credibility", "User_Experience"];
    for (const category of requiredCategories) {
        if (!data[category]) {
            console.error(`[Gazel] Missing category in API response: ${category}`);
            simulateScores();
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

    // Update scores
    updateScore('score-overall', overallScore);
    updateScore('score-audience', data["Target_Audience"]["audience_score"]);
    updateScore('score-messaging', data["Messaging"]["messaging_score"]);
    updateScore('score-credibility', data["Credibility"]["credibility_score"]);
    updateScore('score-ux', data["User_Experience"]["ux_score"]);

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
  for (let i = 0; i < Math.min(explanations.length, 3); i++) {
    const pointId = `${category}-p${i+1}`;
    updateElementContent(pointId, explanations[i]);
  }
}

// Simulate scores when no API data available
function simulateScores() {
  console.log('[Gazel] Using simulated data for display');
  
  // Mark as using simulated data in session storage
  sessionStorage.setItem('usingRealData', 'false');
  
  // Create simulated data using the same function as the API fallback
  const simulatedData = createSimulatedAPIResponse(sessionStorage.getItem('analyzedUrl') || 'example.com');

  // Use the same function that processes real API data
  updateElementsFromRealAPI(simulatedData);
  
  // Add notification that data is simulated
  addSimulatedDataNotice();
}

// Add notification that data is simulated
function addSimulatedDataNotice() {
  // Check if notice already exists
  if (document.querySelector('.simulated-data-notice')) {
    return;
  }
  
  // Create the notice element
  const notice = document.createElement('div');
  notice.className = 'simulated-data-notice';
  notice.style.position = 'fixed';
  notice.style.bottom = '20px';
  notice.style.right = '20px';
  notice.style.padding = '10px 15px';
  notice.style.background = '#FFF9E5';
  notice.style.border = '1px solid #FFD580';
  notice.style.borderRadius = '4px';
  notice.style.color = '#856404';
  notice.style.fontSize = '14px';
  notice.style.fontWeight = '500';
  notice.style.zIndex = '9999';
  notice.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  notice.textContent = 'Note: Using simulated data for demonstration';
  
  // Add to body
  document.body.appendChild(notice);
  
  console.log('[Gazel] Added simulated data notice to page');
  
  // Ensure the notice stays visible by re-checking later
  // (Some frameworks might remove dynamically added elements)
  setTimeout(() => {
    if (!document.querySelector('.simulated-data-notice')) {
      console.log('[Gazel] Notice was removed, adding it again');
      document.body.appendChild(notice.cloneNode(true));
    }
  }, 1000);
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

