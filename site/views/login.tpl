${set([
  pageTitle = "Sign In",
  jsList.push("modules/login"),
  pageLayout = "minimal"
])}
{{partial "head.tpl"}}

{{verbatim}}
<div data-ng-controller="LoginCtrl">

<h2 class="headline">Sign in to PaySwarm</h2>

<div class="alert alert-info headline" data-ng-show="model.sessionExpired">
  Your session has expired so you've been taken to the login screen.
</div>

<form class="headline" method="post" action="" data-ng-submit="submit()">
  <fieldset>
    <div class="control-group">
      <div data-ng-hide="multiple" class="controls">
        <input name="profile" type="text" autofocus="autofocus"
          data-ng-model="profile"
          placeholder="Email" data-ng-disabled="loading" />
      </div>
        
      <div data-ng-show="multiple">
        <p class="alert alert-info">
          <strong>Note:</strong>
          Your email address ({{email}}) is associated with multiple
          profiles. Please select the identity associated with the profile
          you'd like to sign in with.
        </p>
        <div class="controls">
          <select name="profile" autofocus="autofocus"
            data-ng-model="profile"
            data-ng-options="value.id as value.label for value in choices"
            data-ng-disabled="loading">
          </select>
        </div>
      </div>

      <input type="hidden" name="ref" value="{{ref}}"/>
        
      <div class="controls">
        <input name="password" type="password" placeholder="Password"
          data-ng-model="password" data-ng-disabled="loading" />
      </div>
        
      <div data-spinner="loading"
        data-spinner-class="center-spinner"></div>
          
      <div data-ng-hide="loading" class="controls btn-group">
        <button class="btn btn-primary" data-submit-form
          data-ng-disabled="loading">Sign In</button>
        <button class="btn btn-primary dropdown-toggle"
          data-toggle="dropdown"
          data-ng-disabled="loading">
          <span class="caret"></span>
        </button>
        <div></div>
        <ul class="center dropdown-menu">
          <li>
            <a href="/profile/create">
              <i class="icon-user"></i>
              Create a Profile
            </a>
          </li>
          <li>
            <a href="/profile/passcode">
              <i class="icon-refresh"></i>
              Password Reset
            </a>
          </li>
        </ul>
      </div>
        
      <div data-ng-show="error">
        <hr />
        <div class="alert alert-error">{{error}}</div>
      </div>
    </div>
  </fieldset>
</form>

</div>
{{/verbatim}}

{{partial "foot.tpl"}}
