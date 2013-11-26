{{if pageLayout == "normal"}}
<div class="navbar navbar-login">
{{else}}
<div class="navbar">
{{/if}}
  <div class="navbar-inner navbar-inner-banner">
    <div class="container ng-cloak" data-ng-controller="LoginCtrl">
      <a class="brand" href="/"><img
      src="${cacheRoot}${style.brand.src}"
      width="${style.brand.width}" height="${style.brand.height}"
      alt="${style.brand.alt}" /></a>
      {{if pageLayout == "normal"}}
      {{verbatim}}
      <form class="navbar-form pull-right" data-ng-submit="submit()">
        <fieldset>
          <input data-ng-hide="multiple"
            class="input-medium" name="profile" type="text"
            data-ng-model="profile" autofocus="autofocus"
            placeholder="Email" data-ng-disabled="loading" />
          <select data-ng-show="multiple" name="profile" autofocus="autofocus"
            data-tooltip-title="Your email address ({{email}}) is associated with multiple
            profiles. Please select the identity associated with the profile
            you'd like to sign in with."
            data-placement="bottom" data-trigger="hover"
            data-ng-model="profile"
            data-ng-options="value.id as value.label for value in choices"
            data-ng-disabled="loading">
          </select>
          <input class="input-medium" name="password" type="password"
            data-ng-model="password" placeholder="Password"
            data-ng-disabled="loading"
            data-tooltip-title="{{error}}" data-placement="bottom"
            data-tooltip-show="{{error && 'true'}}"
            data-trigger="manual" />
          <div class="btn-toolbar btn-group-banner">
            <div class="btn-group btn-group-banner">
              <a class="btn btn-primary" data-submit-form>Sign In</a>
              <a class="btn btn-primary"
                data-popover-template="/app/templates/navbar-profile-actions.html"
                data-popover-visible="showProfileActions"
                data-title="Profile Actions"
                data-placement="bottom">
                  <i class="caret"></i>
              </a>
            </div>
            <div class="btn-group btn-group-banner">
              <a class="btn btn-inverse" href="/profile/create">Join</a>
            </div>
          </div>
        </fieldset>
      </form>
      {{/verbatim}}
      {{/if}}
    </div>
  </div>
</div>
