document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector("#compose-form").addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views 
  document.querySelector('#singleEmail-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#singleEmail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get the mails from the API
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {

      console.log(email);

      const newEmail = document.createElement('div');
      newEmail.setAttribute('id', 'email');
      newEmail.innerHTML = `
      <h4>From: ${email.sender}</h4>
      <h4>To: ${email.recipients}</h4>
      <h4>Subject: ${email.subject}</h4>
      <h4>Timestamp: ${email.timestamp}</h4>
      `;
      if (email.read === true) {
        newEmail.style.backgroundColor = "#D8D8D8";
      }
      newEmail.addEventListener('click', function() {
        show_email(email.id, mailbox)
      });
      document.querySelector('#emails-view').append(newEmail);
    })
});
}

function send_email(event) {
  event.preventDefault();

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
  });
}

function show_email(id, mb) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      //Print email
      console.log(email);

      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#singleEmail-view').style.display = 'block';

      document.querySelector('#singleEmail-view').innerHTML = `
      <span><button id="reply_button" type="button" class="btn btn-outline-primary">Reply</button></span>
      <span id="archive"></span>
      <h3 id="subject"><b>Subject:</b> ${email.subject}</h3>
      <h5><b>From:</b> ${email.sender}</h5>
      <h5><b>To:</b> ${email.recipients}</h5>
      <hr>
      <h4>${email.body}</h4>
      <hr>
      <h5><b>Timestamp:</b> ${email.timestamp}</h5>
      `;

      //Reply button logic
      document.querySelector('#reply_button').addEventListener('click', function() {

        console.log("The reply button has been clicked !")

        load_mailbox('compose');
        compose_email();

        document.querySelector('#compose-recipients').value = email.sender;
        let subject = email.subject;
        if(subject.split(' ',1)[0] != "Re:"){
          subject = "Re: " + email.subject;
        }
        document.querySelector('#compose-subject').value = subject;
        document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
      })

      //Archive button logic 
      if (mb != 'sent'){
        const archiveButton = document.createElement("button");
        archiveButton.setAttribute('type', 'button');
        archiveButton.setAttribute('class', 'btn btn-outline-primary');
        document.getElementById("archive").appendChild(archiveButton);
  
        if (email.archived === false) {
          archiveButton.textContent = 'Archive';
          document.querySelector('#archive').addEventListener('click', function() {
            fetch(`/emails/${id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: true
              })
            })
            .then(() => {load_mailbox('inbox')})
            archiveButton.textContent = 'Unarchive';
          });
        }
        else {
          archiveButton.textContent = 'Unarchive';
          document.querySelector('#archive').addEventListener('click', function() {
            fetch(`/emails/${id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: false
              })
            })
            .then(() => {load_mailbox('inbox')})
            archiveButton.textContent = 'Archive';
          })
        }
      }
  });
  console.log(`Email ${id} has been clicked!`);

  //Make the email be read after clicking
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}

