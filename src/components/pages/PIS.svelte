<script>
    export let max_duration_str = "10 minutes";

    import CenteredCard from '../partials/CenteredCard.svelte';
</script>
<CenteredCard has_button={true} is_large={true} button_text="I agree" on:continue>
    <h2>Participant Information from the University of Edinburgh</h2>
    <p style="color: green;"><b>Before we begin the research study, please read the following ethics information for participants.</b></p>
    <p>This study was certified according to the Informatics Research Ethics Process, RT number 2019/58792. Please take time to read the following information carefully. You should keep this page for your records.</p>

    <h3>Who are the researchers?</h3>
    <p>The researchers are from the Informatics department at the University of Edinburgh: Christopher G. Lucas and Chentian Jiang.</p>

    <h3>What is the purpose of the study?</h3>
    <p>The purpose of this study is to understand how people learn and make decisions in the face of uncertainty and ambiguity.</p>

    <h3>Why have I been asked to take part?</h3>
    <p>You’ve been asked to take part because we’re interested in studying many different people and their diverse approaches to problems in learning and decision-making.</p>

    <h3>Do I have to take part?</h3>
    <p>No – participation in this study is entirely up to you. You can withdraw from the study at any time, without giving a reason. Your rights will not be affected. If you wish to withdraw, contact the PI. We will not use any identifiable data we collect from you in any publications or presentations submitted after you have withdrawn consent. However, we will retain your withdrawal request.</p>

    <h3>What will happen if I decide to take part?</h3>
    <p>You are invited to participate in an online study that involves observing, interacting with, and making judgments about simple stimuli on a web-based interface, such as geometric shapes and causal systems. Once you finish, we may have some questions about your experience (e.g., age, gender, feedback about how you approached the task). Your responses will be recorded.</p>
    <p>Specifically, we collect non-identifiable data about your responses during the study, including mouse clicks, keyboard presses, and answers to questionnaires. We do not record your audio or video. We may also collect minimal identifiable information about your worker ID and IP address to prevent repeat participation. The identifiable information will only be stored in a secure database and only for the duration of data collection. This information will be stripped from the datasets prior to any academic publications.</p>

    <p>Your session should last for up to {max_duration_str}. You will be given full instructions shortly.</p>

    <h3>Are there any risks associated with taking part?</h3>
    <p>There are no significant risks associated with participation.</p>

    <h3>Are there any benefits associated with taking part?</h3>
    <p>There are no tangible benefits to you. However, you will be contributing to our knowledge of human learning and inference.</p>

    <h3>What will happen to the results of this study?</h3>
    <p>The results of this study may be summarized in published articles, reports and presentations. Quotes or key findings will be anonymized: We will remove any information that could, in our assessment, allow anyone to identify you. With your consent, information can also be used for future research. Your anonymized data may be publicly released and other data may be archived for a minimum of 2 years.</p>

    <h3>Data protection and confidentiality.</h3>
    <p>Your data will be processed in accordance with Data Protection Law.  All identifiable information collected about you will be kept strictly confidential. Your data will be referred to by a unique participant number rather than by name. All identifiable data will only be viewed by the research team (listed above).</p>
    <p>All identifiable electronic data will be stored on a password-protected encrypted computer, on the School of Informatics’ secure file servers, or on the University’s secure encrypted cloud storage services (DataShare, ownCloud, or Sharepoint) and all paper records will be stored in a locked filing cabinet in the PI’s office. Your consent information will be kept separately from your responses in order to minimize risk.</p>

    <h3>What are my data protection rights?</h3>
    <p>The University of Edinburgh is a Data Controller for the information you provide. You have the right to access information held about you. Your right of access can be exercised in accordance with Data Protection Law. You also have other rights including rights of correction, erasure and objection. However, for fully anonymized data, it may be impossible to find, edit, and/or delete information about any individual. For more details, including the right to lodge a complaint with the Information Commissioner’s Office, please visit www.ico.org.uk. Questions, comments and requests about your personal data can also be sent to the University Data Protection Officer at dpo@ed.ac.uk.</p>

    <p>For general information about how we use your data, go to: edin.ac/privacy-research</p>

    <h3>Who can I contact?</h3>
    <p>If you have any further questions about the study, please contact the lead researcher, Christopher G. Lucas, cocosci_support@mlist.is.ed.ac.uk.</p>
    <p>If you have a complaint that the research team (cocosci_support@mlist.is.ed.ac.uk) cannot resolve, please contact inf-ethics@inf.ed.ac.uk. When you contact us, please provide the study title and detail the nature of your complaint.</p>

    <h3>Consent</h3>
    <p>By proceeding with the study, I agree to all of the following statements:</p>
    <ul>
        <li>I have read and understood the above information.</li>
        <li>I understand that my participation is voluntary, and I can withdraw at any time.</li>
        <li>I consent to my anonymized data being used in academic publications and presentations.</li>
        <li>I allow my data to be used in future ethically approved research.</li>
    </ul> 
</CenteredCard>