${set(
  pageTitle = "Financial Account Details"
)}
{{partial "head.tpl"}}

<div class="row">
  <h2 class="headline">${pageTitle}</h2>
</div>

{{verbatim}}
<div data-ng-controller="AccountCtrl" class="ng-cloak">

  <div data-ng-show="account.label" class="row">
    <h3 class="headline">{{account.label}}
      <span data-ng-show="account.psaStatus">({{account.psaStatus}})</span>
    </h3>
  <div>

  <div data-ng-show="account.balance" class="row">
    <div class="offset3 span6">
      <h1 class="money headline">
        <span data-account-balance="account"></span>
      </h1>
    </div>
  </div>

  <div class="row">
    <div class="offset3 span6">
      <h3 class="headline">
        View: <span><a href="?view=activity">activity</a><span data-ng-show="account.owner">, <a href="{{account.owner}}">owner</a></span>
      </h3>
    </div>
  </div>

</div>
{{/verbatim}}

{{partial "foot.tpl"}}
