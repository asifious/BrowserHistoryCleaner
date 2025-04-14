document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const resultsDiv = document.getElementById('results');
  const selectAllCheckbox = document.getElementById('selectAll');
  const deleteSelectedBtn = document.getElementById('deleteSelected');
  let historyItems = [];

 
  // Search history
  searchBtn.addEventListener('click', () => {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
      resultsDiv.innerHTML = '<p>Please enter a search term.</p>';
      return;
    }

    chrome.history.search({
      text: searchTerm,
      maxResults: 500,
      startTime: 0
    }, (results) => {
      historyItems = results;
      displayResults(results);
    });
  });

  // Display search results
  function displayResults(items) {
    resultsDiv.innerHTML = '';
    if (items.length === 0) {
      resultsDiv.innerHTML = '<p>No results found.</p>';
      return;
    }

    /*  */

    // items.forEach((item, index) => {
    //   const div = document.createElement('div');
    //   div.className = 'history-item';
    //   div.innerHTML = `
    //     <input type="checkbox" class="item-checkbox" data-index="${index}">
    //     <span class="item-visit-time" >${new Date(item.lastVisitTime).toLocaleString()}</span>

    //     <a id="link" class="website-link" focus-row-control="" focus-type="link" href="${item.url}" target="_blank" rel="noopener noreferrer">
    //       <img class="favicon" src="${item.favIconUrl || 'https://www.google.com/s2/favicons?domain=' + item.url}" alt="Favicon">
    //       <span class="website-title" style="text-align: start;">${item.title || item.url}</span>
    //       <span class="website-url" style="text-align: start;">${item.url}</span>
    //     </a>
        
    //     <span class="item-visit-count" style="text-align: end;">${item.visitCount} visits</span>

    //     <button class="delete-btn single-delete" data-url="${item.url}">Delete</button>
 
    //   `;
    //   resultsDiv.appendChild(div);
    // }); <img class="favicon" src="${item.favIconUrl || 'https://www.google.com/s2/favicons?domain=' + item.url}" alt="Favicon">

    items.forEach((item, index) => {

            // Get the domain only
            const domain = new URL(item.url).hostname;

            // const faviconUrl = item.favIconUrl && item.favIconUrl.trim() !== ''
            //                   ? item.favIconUrl
            //                   : `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
            // <img class="favicon" src="${faviconUrl}" alt="Favicon">



      const div = document.createElement('div');
      div.className = 'history-item';

      div.innerHTML = `
        <input type="checkbox" class="item-checkbox" data-index="${index}">
        <span class="item-visit-time">${new Date(item.lastVisitTime).toLocaleString()}</span>
        <a id="link" class="website-link" focus-row-control="" focus-type="link" href="${item.url}" target="_blank" rel="noopener noreferrer">
          <span class="website-title" style="text-align: start;">${item.title || item.url}</span>
          <span id="domain" class="website-url" style="text-align: start;">${domain}</span>
        </a>
        <span class="item-visit-count" style="text-align: end;">${item.visitCount} visits</span>
        <i class="fa fa-trash delete-btn single-delete" data-url="${item.url}" aria-hidden="true" style="cursor: pointer;"></i>
      `;
    
      resultsDiv.appendChild(div);
    });
    

    // Add event listeners for single delete buttons
    document.querySelectorAll('.single-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = e.target.dataset.url;
        deleteHistoryItem(url);
      });
    });
  }

  // Select all checkbox
  selectAllCheckbox.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.item-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = e.target.checked;
    });
  });

  // Delete selected items
  deleteSelectedBtn.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.item-checkbox:checked');
    const urlsToDelete = Array.from(checkboxes).map(cb => historyItems[cb.dataset.index].url);

    if (urlsToDelete.length === 0) {
      resultsDiv.innerHTML = '<p>Please select at least one item to delete.</p>';
      return;
    }

    urlsToDelete.forEach(url => deleteHistoryItem(url));
  });

  // Delete individual history item
  function deleteHistoryItem(url) {
    chrome.history.deleteUrl({ url }, () => {
      // Refresh the display after deletion
      const searchTerm = searchInput.value.trim();
      if (searchTerm) {
        chrome.history.search({
          text: searchTerm,
          maxResults: 100,
          startTime: 0
        }, (results) => {
          historyItems = results;
          displayResults(results);
          // Uncheck select all if it was checked
          selectAllCheckbox.checked = false;
        });
      } else {
        resultsDiv.innerHTML = '';
      }
    });
  }

  // Allow search on Enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchBtn.click();
    }
  });
});