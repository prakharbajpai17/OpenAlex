const search = document.getElementById('searchbox')
const matchList = document.getElementById('match-list')
const selectBox = document.getElementById('select-box')

var currentPage = 1
var totalPages = 1
var query = ''
var isAuthor = false
var isInstitution = false

// Fetch results function
// Used for works
function fetchResults (
  searchTerm,
  pageNum,
  authorPage = false,
  resetPageNum = false,
  institutionPage = false
) {
  // Set query to what was in the search box and put the variable in the search variable
  query = searchTerm

  // If true is passed in for Author page, we set the global variable isAuthor to true
  // If true is passed in for institutionPage, we set the global variable isInstitution to true
  // This helps control the prev/next buttons navigate based on author specific API calls
  if (authorPage) {
    isAuthor = true
    isInstitution = false
  } else if (institutionPage) {
    isAuthor = false
    isInstitution = true
  }

  // Reset page number if true is passed in for resetPageNum
  if (resetPageNum) {
    currentPage = 1
  }

  // Update the API URL based on whether or not we're searching for Works, Authors, institutions
  if (authorPage == false && institutionPage == false) {
    var staticURL = `https://api.openalex.org/works?filter=title.search:${searchTerm}&page=${pageNum}`
  } else if (authorPage == true && institutionPage == false) {
    authorPage = true
    var staticURL = `https://api.openalex.org/works?filter=author.id:${searchTerm}&page=${pageNum}`
  } else if (authorPage == false && institutionPage == true) {
    var staticURL = `https://api.openalex.org/works?filter=institutions.id:${searchTerm}&page=${pageNum}`
  }

  // Get JSON data from the URL and handle it
  $.getJSON(staticURL, function (data) {
    // Multiply the total results by number of search results
    // 25 is hard coded at the moment, but this can be updated to give the user
    // control on how many search results they'd like to see
    totalPages = Math.ceil(data.meta.count / 25)

    // Begin the HTML string. We will be appending to this string until the end
    resultsList = '<div class="result"><hr>'

    // Loop through the results
    for (i = 0; i < data.results.length; i = i + 1) {
      // Build the author string to inject later when we set the results
      var authorString = ''

      try {
        // Loop through all of the Authors that are returned
        for (x = 0; x < data.results[i].authorships.length; x = x + 1) {
          var author = data.results[i].authorships[x].author.display_name
          var authorID = data.results[i].authorships[x].author.id

          // If X is lower than or equal to 0, just show the first author without a comma at the end
          if (x <= 0) {
            authorString = `${authorString}<a onClick="fetchResults('${authorID}', 1, true, true)" href="#">${author}</a>`
          } else if (x <= 8) {
            // If its less than or equal to 8, append to the string with a comma to separate authors
            authorString = `${authorString}, <a onClick="fetchResults('${authorID}', 1, true, true)" href="#">${author}</a>`
          } else if (x == data.results[i].authorships.length - 1) {
            // When x is equal to the length (minus 1), we get the remaining authors by
            // subtracting the total by 8 (the number we're displaying at a time)
            // Then we set the string to say "and x more." at the end.
            var remainingAuthors = x - 8
            authorString = `${authorString}, and <b>${remainingAuthors} more.</b>`
          }
        }
      } catch {
        // Set author to N/A if empty
        authorString = 'N/A'
      }

      try {
        // Try to get institution from JSON results. If failed, set institution to N/A
        var institution =
          data.results[i].authorships[0].institutions[0].display_name
      } catch (error) {
        var institution = 'N/A'
      }

      try {
        // Try to get type from JSON results. If failed, set type to N/A
        var type = data.results[i].type
      } catch (error) {
        var type = 'N/A'
      }

      // Results list is appended onto itself to build all of the HTML that we're going to paste
      // onto the page once the query is done running.
      resultsList =
        resultsList +
        `<div class="resultcontent"><h5><a href="${data.results[i].doi}" target="_blank">${data.results[i].title}</a></h5>
            <b>Author:</b> ${authorString}
            <br><b>Institution:</b> ${institution}
            <br><b>Type:</b> ${type}</b>
            <br><b>Publication Date:</b> ${data.results[i].publication_date}</b></div><hr>`
    }

    // Create a breakline and create a center tag to center the page data at the bottom
    resultsList = resultsList + `<br><center>`

    // If the current page is 1 we disable the previous button
    if (currentPage == 1) {
      resultsList =
        resultsList +
        `<button type="button" id="btnPrev" onclick="btnPrev()" class="btn btn-primary" disabled>Prev</button>`
    } else {
      resultsList =
        resultsList +
        `<button type="button" id="btnPrev" onclick="btnPrev()" class="btn btn-primary">Prev</button>`
    }

    // Display the current page and total pages separated by a forward slash
    resultsList = resultsList + `  ${currentPage}/${totalPages}  `

    // If current page is the same at the total pages (last page), disable the next button
    if (currentPage == totalPages) {
      resultsList =
        resultsList +
        `<button type="button" id="btnNext" onclick="btnNext()" class="btn btn-primary" disabled>Next</button>`
    } else {
      resultsList =
        resultsList +
        `<button type="button" id="btnNext" onclick="btnNext()" class="btn btn-primary">Next</button>`
    }

    // Finish off the center tag and close the div
    resultsList = resultsList + '</center></div>'

    // Paste the combined HTML text to the matchList div on the HTML page
    matchList.innerHTML = resultsList
  })
}

function searchAuthor (searchTerm, pageNum, resetPageNum = false) {
  // This function is almost identical to the fetchResults one, but has specific information for
  // author searching. This is used to actually search for authors whereas the author flag in
  // fetchResults shows works by specific authors. The results are different.
  query = searchTerm

  // Reset page number if true is passed in for resetPageNum
  if (resetPageNum) {
    currentPage = 1
  }

  var staticURL = `https://api.openalex.org/authors?search=${searchTerm}&page=${pageNum}`

  // Get JSON data from the URL and handle it
  $.getJSON(staticURL, function (data) {
    // Multiply the total results by number of search results
    // 25 is hard coded at the moment, but this can be updated to give the user
    // control on how many search results they'd like to see
    totalPages = Math.ceil(data.meta.count / 25)

    // Begin the HTML string. We will be appending to this string until the end
    resultsList = '<div class="result"><hr>'

    // Loop through the results
    for (i = 0; i < data.results.length; i = i + 1) {
      // Build the author string to inject later when we set the results

      var displayName = ''
      var worksCount
      var citedCount
      var authorID

      try {
        displayName = data.results[i].display_name
      } catch {
        // Set author to N/A if empty
        displayName = 'N/A'
      }

      try {
        worksCount = data.results[i].works_count
      } catch (error) {
        worksCount = 'N/A'
      }

      try {
        // Try to get type from JSON results. If failed, set type to N/A
        citedCount = data.results[i].cited_by_count
      } catch (error) {
        citedCount = 'N/A'
      }

      try {
        authorID = data.results[i].id
      } catch (error) {
        authorID = 'N/A'
      }

      // Results list is appended onto itself to build all of the HTML that we're going to paste
      // onto the page once the query is done running.
      resultsList =
        resultsList +
        `<div class="resultcontent"><h5>${displayName}</h3>
            <b>Works Count:</b> <a onClick="fetchResults('${authorID}', 1, true, true)" href="#">${worksCount}</a>
            <br><b>Cited Count:</b> ${citedCount}
          </div><hr>`
    }

    // Create a breakline and create a center tag to center the page data at the bottom
    resultsList = resultsList + `<br><center>`

    // If the current page is 1 we disable the previous button
    if (currentPage == 1) {
      resultsList =
        resultsList +
        `<button type="button" id="btnPrev" onclick="btnPrevAuthor()" class="btn btn-primary" disabled>Prev</button>`
    } else {
      resultsList =
        resultsList +
        `<button type="button" id="btnPrev" onclick="btnPrevAuthor()" class="btn btn-primary">Prev</button>`
    }

    // Display the current page and total pages separated by a forward slash
    resultsList = resultsList + `  ${currentPage}/${totalPages}  `

    // If current page is the same at the total pages (last page), disable the next button
    if (currentPage == totalPages) {
      resultsList =
        resultsList +
        `<button type="button" id="btnNext" onclick="btnNextAuthor()" class="btn btn-primary" disabled>Next</button>`
    } else {
      resultsList =
        resultsList +
        `<button type="button" id="btnNext" onclick="btnNextAuthor()" class="btn btn-primary">Next</button>`
    }

    // Finish off the center tag and close the div
    resultsList = resultsList + '</center></div>'

    // Paste the combined HTML text to the matchList div on the HTML page
    matchList.innerHTML = resultsList
  })
}

function searchInstitutions (searchTerm, pageNum, resetPageNum = false) {
  // This function is also nearly the same as fetchResults, but specific to
  // institution search. This shows a list of institutions and creates a link
  // to search for works by that particular institue.
  query = searchTerm

  // Reset page number if true is passed in for resetPageNum
  if (resetPageNum) {
    currentPage = 1
  }

  var staticURL = `https://api.openalex.org/institutions?search=${searchTerm}&page=${pageNum}`

  // Get JSON data from the URL and handle it
  $.getJSON(staticURL, function (data) {
    // Multiply the total results by number of search results
    // 25 is hard coded at the moment, but this can be updated to give the user
    // control on how many search results they'd like to see
    totalPages = Math.ceil(data.meta.count / 25)

    // Begin the HTML string. We will be appending to this string until the end
    resultsList = '<div class="result"><hr>'

    // Loop through the results
    for (i = 0; i < data.results.length; i = i + 1) {
      // Build the author string to inject later when we set the results

      var displayName = ''
      var type = ''
      var homePage = ''
      var worksCount
      var citedCount
      var id

      try {
        displayName = data.results[i].display_name
      } catch {
        // Set author to N/A if empty
        displayName = 'N/A'
      }

      try {
        worksCount = data.results[i].works_count
      } catch (error) {
        worksCount = 'N/A'
      }

      try {
        // Try to get type from JSON results. If failed, set type to N/A
        citedCount = data.results[i].cited_by_count
      } catch (error) {
        citedCount = 'N/A'
      }

      try {
        type = data.results[i].type
      } catch (error) {
        authorID = 'N/A'
      }

      try {
        homePage = data.results[i].homepage_url
      } catch (error) {
        homePage = 'N/A'
      }

      try {
        id = data.results[i].id
      } catch (error) {
        id = 'N/A'
      }

      // Results list is appended onto itself to build all of the HTML that we're going to paste
      // onto the page once the query is done running.
      resultsList =
        resultsList +
        `<div class="resultcontent"><h5><a href="${homePage}" target="_blank">${displayName}</a></h5>
            <b>Type:</b> ${type}
            <br><b>Works Count:</b> <a onClick="fetchResults('${id}', 1, false, true, true)" href="#">${worksCount}</a>
            <br><b>Cited Count:</b> ${citedCount}</div>
          <hr>`
    }

    // Create a breakline and create a center tag to center the page data at the bottom
    resultsList = resultsList + `<br><center>`

    // If the current page is 1 we disable the previous button
    if (currentPage == 1) {
      resultsList =
        resultsList +
        `<button type="button" id="btnPrev" onclick="btnPrevInstitution()" class="btn btn-primary" disabled>Prev</button>`
    } else {
      resultsList =
        resultsList +
        `<button type="button" id="btnPrev" onclick="btnPrevInstitution()" class="btn btn-primary">Prev</button>`
    }

    // Display the current page and total pages separated by a forward slash
    resultsList = resultsList + `  ${currentPage}/${totalPages}  `

    // If current page is the same at the total pages (last page), disable the next button
    if (currentPage == totalPages) {
      resultsList =
        resultsList +
        `<button type="button" id="btnNext" onclick="btnNextInstitution()" class="btn btn-primary" disabled>Next</button>`
    } else {
      resultsList =
        resultsList +
        `<button type="button" id="btnNext" onclick="btnNextInstitution()" class="btn btn-primary">Next</button>`
    }

    // Finish off the center tag and close the div
    resultsList = resultsList + '</center></div>'

    // Paste the combined HTML text to the matchList div on the HTML page
    matchList.innerHTML = resultsList
  })
}

// Clicking next ups the currentPage value and reruns the fetchResults function
function btnNext () {
  currentPage += 1
  if (isAuthor) {
    // set the fetch script to fetch author specific information
    fetchResults(query, currentPage, true)
  } else if (isInstitution) {
    // set the fetch script to fetch institute specific information
    fetchResults(query, currentPage, false, false, true)
  } else {
    fetchResults(query, currentPage)
  }
}

// Clicking next downs the currentPage value and reruns the fetchResults function
function btnPrev () {
  currentPage -= 1
  if (isAuthor) {
    // set the fetch script to fetch author specific information
    fetchResults(query, currentPage, true)
  } else if (isInstitution) {
    // set the fetch script to fetch institute specific information
    fetchResults(query, currentPage, false, false, true)
  } else {
    fetchResults(query, currentPage)
  }
}

function btnNextAuthor () {
  // Used specifically for author search results.
  currentPage += 1
  searchAuthor(query, currentPage)
}

function btnPrevAuthor () {
  // Used specifically for author search results.
  currentPage -= 1
  searchAuthor(query, currentPage)
}

function btnNextInstitution () {
  // Used specifically for institution search results.
  currentPage += 1
  searchInstitutions(query, currentPage)
}

function btnPrevInstitution () {
  // Used specifically for institution search results.
  currentPage -= 1
  searchInstitutions(query, currentPage)
}

// Function when clicking the button
function btnSearch () {
  var searchTerm = search.value
  currentPage = 1

  console.log(selectBox.value)

  // Do the proper search type based on the dropdown box value
  switch (selectBox.value) {
    case 'works':
      if (searchTerm != '') {
        isAuthor = false
        fetchResults(searchTerm, currentPage)
      }
      break

    case 'author':
      if (searchTerm != '') {
        searchAuthor(searchTerm, currentPage)
      }
      break

    case 'institution':
      if (searchTerm != '') {
        searchInstitutions(searchTerm, currentPage)
      }
  }
}

function updateSelection () {
  // Updates the placeholder text in the search box based on what selection is made
  // in the dropdown box.

  switch (selectBox.value) {
    case 'works':
      search.placeholder = 'Search Works'
      break
    case 'author':
      search.placeholder = 'Search Authors'
      break
    case 'institution':
      search.placeholder = 'Search Institutions'
      break
  }
}

// Make Enter key press the search button
search.addEventListener('keypress', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    document.getElementById('btnSearch').click()
  }
})
