document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const resultsDiv = document.getElementById('results');
  const selectAllCheckbox = document.getElementById('selectAll');
  const deleteSelectedBtn = document.getElementById('deleteSelected');
  let historyItems = [];

  // Spinner for loading
  const loadingSpinner = document.getElementById('loadingSpinner');

  function showSpinner() {
    loadingSpinner.style.display = 'inline-block';
  }

  function hideSpinner() {
    loadingSpinner.style.display = 'none';
  }



  // Initial search to load history
  chrome.history.search({ text: '', maxResults: 200, startTime: 0 }, (results) => {
        historyItems = results;
        displayResults(results);
      }
    );

  // Clear search input on focus
  searchInput.addEventListener('focus', () => {
    searchInput.value = '';
    resultsDiv.innerHTML = ''; // Clear previous results
  }
  );

  // Clear search input on focus out
  searchInput.addEventListener('focusout', () => {
    if (searchInput.value.trim() === '') {
      searchInput.value = 'Search History...';
        // load history
        chrome.history.search({ text: '', maxResults: 200, startTime: 0 }, (results) => {
          historyItems = results;
          displayResults(results);
          }
        );
      }
    }
  );

  // Toggle dark mode
  document.getElementById('darkModeToggle').addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    document.getElementById('darkModeToggle').textContent = isDark ? '☀️' : '🌙';
    chrome.storage.sync.set({ darkMode: isDark });
  });

  // Search history
  searchBtn.addEventListener('click', () => {
    const searchTerm = searchInput.value.trim();

    const searchOptions = {
      text: searchTerm || '', // if empty, get all
      maxResults: searchTerm ? 1000 : 200,
      startTime: 0
    };

    chrome.history.search(searchOptions, (results) => {
      historyItems = results;
      displayResults(results);
    });
  });


  // Display search results
  function displayResults(items) {
    resultsDiv.innerHTML = '';
    if (items.length === 0) {
      resultsDiv.innerHTML = '<p id="noRslt">No results found.</p>';
      return;
    }



    items.forEach((item, index) => {

            // Get the domain only
            const domain = new URL(item.url).hostname;

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
  const updateCheckedCount = () => {
    const checkedCount = document.querySelectorAll('.item-checkbox:checked').length;
    const selectAllText = document.getElementById('selectAlltxt');
    if (checkedCount === 0) {
      selectAllText.innerText = 'Select All';
    } else {
      selectAllText.innerText = `Select All - ${checkedCount}`;
    }
  };



  // Handle "Select All" checkbox
  selectAllCheckbox.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.item-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = e.target.checked;
    });
    updateCheckedCount();
  });
  
  // Update count when any individual checkbox is changed
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('item-checkbox')) {
      updateCheckedCount();
    }
  });
  
  

  // Delete selected items
    deleteSelectedBtn.addEventListener('click', () => {
      const checkboxes = document.querySelectorAll('.item-checkbox:checked');
      const urlsToDelete = Array.from(checkboxes).map(cb => historyItems[cb.dataset.index].url);

      if (urlsToDelete.length === 0) {
        resultsDiv.innerHTML = '<p id="noRslt">Please select at least one item to delete.</p>';
        return;
      }

      showSpinner(); // Show loading spinner


      let deletedCount = 0;

      urlsToDelete.forEach(url => {
        chrome.history.deleteUrl({ url }, () => {
          deletedCount++;
          if (deletedCount === urlsToDelete.length) {
            hideSpinner(); // Hide spinner when done
          }
          // When all deletions are done, refresh the display
          if (deletedCount === urlsToDelete.length) {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
              chrome.history.search({
                text: searchTerm,
                maxResults: 1000,
                startTime: 0
              }, (results) => {
                historyItems = results;
                displayResults(results);
                selectAllCheckbox.checked = false;
                document.getElementById('selectAlltxt').innerText = 'Select All';

              });
            } else {
              resultsDiv.innerHTML = '';
            }
          }
        });
      });

    });

    // Delete all search results
        document.getElementById('deleteAll').addEventListener('click', () => {
            const searchTerm = searchInput.value.trim();
            if (!searchTerm) {
              alert("Enter a search term to delete matching history items.");
              return;
            }

            if (!confirm(`Are you sure you want to delete ALL history items matching "${searchTerm}"?`)) return;

            showSpinner(); // Show loading spinner
            const batchSize = 1000;
            const startTime = 0;

            function deleteNextBatch() {
              chrome.history.search({ text: searchTerm, maxResults: batchSize, startTime }, (results) => {
                if (results.length === 0) {
                  hideSpinner(); // Hide spinner when done
                  resultsDiv.innerHTML = '<p id="noRslt">All matching history items deleted.</p>';
                  historyItems = [];
                  selectAllCheckbox.checked = false;
                  document.getElementById('selectAlltxt').innerText = `Select All`;
                  return;
                }

                let deletedCount = 0;

                results.forEach(item => {
                  chrome.history.deleteUrl({ url: item.url }, () => {
                    deletedCount++;
                    if (deletedCount === results.length) {
                      deleteNextBatch(); // Process next batch
                    }
                  });
                });
              });
            }

            deleteNextBatch(); // Start deletion loop
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
