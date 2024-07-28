document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#viewing-email').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#viewing-email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach( eachEmail => {
      const element = document.createElement('div');
      element.className = eachEmail.read? "email-read":"email-unread";
      element.innerHTML = `
      <ul class="row-list">
      <li><h6>Sender: ${eachEmail.sender}</h6></li>
      <li><h6 style="display: inline-block;">Subject:</h6> ${eachEmail.subject}</li>
      <li>Sent on ${eachEmail.timestamp}</li>
      </ul>
      `;
      element.addEventListener('click', () => view_email(eachEmail.id,mailbox));
      document.querySelector('#emails-view').append(element);
    })
  });
}

function send_email(event){
  event.preventDefault();
  const recipient = document.querySelector('#compose-recipients').value;
  const subject= document.querySelector('#compose-subject').value;
  const body=  document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipient,
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

function view_email(id,mailbox){
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  const email_view=document.querySelector('#viewing-email');
  email_view.style.display = 'block';
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    //displaying email
    console.log(email);
    email_view.innerHTML = `
    <ul class="list-group">
    <li><b>From:</b> ${email.sender}</li>
    <li><b>To: </b> ${email.recipients}</li>
    <li><b>Subject:</b> ${email.subject}</li>
    <li><b>Timestamp:</b> ${email.timestamp}</li>
    </ul>
    `;

    if (mailbox !== 'sent'){
    //archive/unarchive button
    archive = document.createElement('button');
    archive.className = email.archived? "btn btn-sm btn-danger float-right":"btn btn-sm btn-outline-primary float-right";
    archive.innerHTML = email.archived? "Unarchive":"Archive";
    archive.addEventListener('click', function() {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived : !email.archived
          })
        })
        .then(response => load_mailbox('inbox'))
  });
  email_view.append(archive);
    }

    //reply button
    reply = document.createElement('button');
    reply.className ="btn btn-sm btn-outline-primary";
    reply.innerHTML ="Reply";
    reply.addEventListener('click', function() {
      compose_email();
      let subject = email.subject;
      if ( subject.split(' ',1)[0] != "Re:"){
        subject = "Re: " + subject;
      }
      document.querySelector('#compose-recipients').value = email.sender;
      document.querySelector('#compose-subject').value = subject;
      document.querySelector('#compose-body').value= `${email.body} Written on ${email.timestamp} By ${email.sender}`;


  });
  email_view.append(reply);

  // displaying body of the email
  const body = document.createElement('p');
  body.innerHTML=`
  <hr>
  ${email.body}
  `;
  email_view.append(body);

    //mark email as unread
    if(!email.read){
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    }
});
}