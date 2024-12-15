// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('upload-form');
    const filesList = document.getElementById('files-list');
  
    // Function to fetch and display files
    async function fetchFiles() {
      try {
        const response = await fetch('/api/files'); // Fetch files from the backend
        const files = await response.json();
  
        filesList.innerHTML = ''; // Clear the list
        files.forEach((file) => {
          const listItem = document.createElement('li');
          listItem.innerHTML = `
            <span>${file.filename}</span>
            <a href="/download/${file._id}">Download</a>
            <button data-id="${file._id}">Delete</button>
          `;
          filesList.appendChild(listItem);
        });
  
        // Add delete functionality to buttons
        const deleteButtons = filesList.querySelectorAll('button');
        deleteButtons.forEach((button) =>
          button.addEventListener('click', async (e) => {
            const fileId = e.target.getAttribute('data-id');
            await deleteFile(fileId);
          })
        );
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    }
  
    // Function to upload a file
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(uploadForm);
  
      try {
        await fetch('/upload', {
          method: 'POST',
          body: formData,
        });
        fetchFiles(); // Refresh the file list
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    });
  
    // Function to delete a file
    async function deleteFile(fileId) {
      try {
        await fetch(`/delete/${fileId}`, {
          method: 'POST',
        });
        fetchFiles(); // Refresh the file list
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
  
    // Load the file list on page load
    fetchFiles();
  });
  