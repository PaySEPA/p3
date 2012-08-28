${set(pageTitle = "Error")}
{{partial "head.tpl"}}

<h2>Sorry!</h2>

<div>
  <p>Our website is experiencing technical difficulties. We apologize for
  any inconvenience this has caused you.</p>
  <p>Please try again later. If the problem continues, please contact
  <a href="mailto:support@digitalbazaar.com">Customer Support</a> with the
  details of what went wrong.</p>
	
  {{if debug}}
  <pre><code>Exception: ${exception}</code></pre>
  {{/if}}
</div>

{{partial "foot.tpl"}}
