(function() {

  return {
    events: {
      'app.activated': 'getUserInfo',
      'requestUserInfo.fail': 'this.showError',
      'click #tab1': 'this.renderTicketRow',
      'click #tab2': 'this.renderUserRow',
      'click #tab3': 'this.renderOrgRow',
      'click .acc_notes': 'this.updateAccNotes',
      'blur #acc_notes_input': 'this.saveAccNotes',
      'ticket.save': 'this.checkFields'
      
      /*
      'ticket.viewers.changed': function(viewers) {
          var editors = viewers.filter(function(viewer) {
            return viewer.isEditing();
          });
          var editorNames = editors.map(function(editor) {
            return editor.name();
          });
          services.notify(editorNames.join(', ') + ' are editing');
      }
      */
    },

    requests: {

      // Request requester information for this ticket
      requestUserInfo: function(subdomain, user_id) {
        return {
          url: 'https://' + subdomain + '.zendesk.com/api/v2/users/' + user_id + '.json',
          type: 'GET',
          dataType: 'json',
        };
      },

      // Request organisation information for this ticket
      requestOrgInfo: function(subdomain, org_id) {
        return {
          url: 'https://' + subdomain + '.zendesk.com/api/v2/organizations/' + org_id + '.json',
          type: 'GET',
          dataType: 'json'
        };
      },

      // Request ticket information for all tickets submitted by the requester of the current ticket
      getAllTickets: function(subdomain, user_id) {
        return {
          url: 'https://' + subdomain + '.zendesk.com/api/v2/users/' + user_id + '/tickets/requested.json',
          type: 'GET',
          dataType: 'json'
        };
      },

      searchForTickets: function(user_id, _org_id) {
        return {
          url: '/api/v2/search.json?query=status<pending',
          type: 'GET',
          dataType: 'json'
        };
      },

      updateOrgNotes: function(subdomain, org_id, dataObject) {
        return {
          url: '/api/v2/organizations/' + org_id + '.json',
          type: 'PUT',
          dataType: 'json',
          data: dataObject
        };
      }
    },

    getUserInfo: function() {
      var ticket = this.ticket();
      var tags = ticket.tags();

      var org = ticket.organization();

      var user = ticket.requester();

      var active = false;

      this.renderTemplate("layout");

      // Display notification that info is missing in either user or org profile
      if (typeof org === "undefined") {
        this.$('.warning .red:eq(1)').show();
      }

      // Loop through ticket tags
      for (var x = 0;x < tags.length;x++) {

        // Check tags for certification info
        if (tags[x] == "developer_certified_user") {
          this.$('#certs p:eq(0)').show();
        } else if (tags[x] == "platform_certified_user") {
          //this.$('#certs').append("<p>Platform Certified</p>");
          this.$('#certs p:eq(1)').show();
        }

        // Check tags for partner info
        if (tags[x] == "partner_account") {
          this.$('#partner p:eq(0)').show();
        } else if (tags[x] == "account_has_partner") {
          this.$('#partner p:eq(1)').text(this.$('#partner p:eq(1)').text() + org.customField("partner_name"));
          this.$('#partner p:eq(1)').show();
        }

        // Check tags for product info - mobile
        if (tags[x] == "subscription_includes_android" || tags[x] == "subscription_includes_ios") {
          if (tags[x] == "subscription_includes_android" && tags[x] == "subscription_includes_ios") {
            this.$('#product p:eq(0)').show();
          } else if (tags[x] == "subscription_includes_android") {
            this.$('#product p:eq(2)').show();
          } else if (tags[x] == "subscription_includes_ios") {
            this.$('#product p:eq(1)').show();
          }
        }

        // Check tags for product info - A/B and P13n
        if (tags[x] == "subscription_includes_a_b_testing") {
          this.$('#product p:eq(3)').show();
        } else if (tags[x] == "subscription_includes_personalization") {
          this.$('#product p:eq(4)').show();
        }

        // Check tags for segment info
        if (tags[x] == "strategic_segment") {
          this.$('#segment p:eq(0)').show();
        } else if (tags[x] == "enterprise_segment") {
          this.$('#segment p:eq(1)').show();
        } else if (tags[x] == "corporate_segment") {
          this.$('#segment p:eq(2)').show();
        } else if (tags[x] == "smb_segment") {
          this.$('#segment p:eq(3)').show();
        }

        // Check tags for support entitlement & whether subscription is active
        if (tags[x] == "active_subscription") {
          active = true;
        }

        //Update app whenever changes take place e.g. requester is changed

        //end of for loop  
      }

      // Set default Salesforce links to the overview pages for contacts, accounts and subscriptiond
      var orgUrl = "https://c.na28.visual.force.com/apex/Skuid_SubscriptionsTab?save_new=1&sfdc.override=1";
      var accUrl = "https://c.na28.visual.force.com/apex/Skuid_AccountsTab?save_new=1&sfdc.override=1";
      var userUrl = "https://c.na28.visual.force.com/apex/Skuid_ContactsTab?save_new=1&sfdc.override=1";

      // If we have the contact id, account id or subscription id, update the links to go directly to this record
      if (org.customField("subscription_id") !== null) {
        orgUrl = "https://c.na28.visual.force.com/apex/Skuid_SubscriptionDetail?id=" + org.customField("subscription_id") + "&sfdc.override=1";
      }
      if (org.customField("id") !== null) {
        accUrl = "https://c.na28.visual.force.com/apex/Skuid_AccountDetail?id=" + org.customField("id") + "&sfdc.override=1";
      }
      if (user.customField("zendesk_salesforce_contact_id") !== null) {
        userUrl = "https://c.na28.visual.force.com/apex/Skuid_ContactDetail?id=" + user.customField("zendesk_salesforce_contact_id") + "&sfdc.override=1";
      }

      this.$(".links p:eq(1)").replaceWith("<p><a href=" + orgUrl + " target='_blank'>Go to SFDC Subscription</a></p>");
      this.$(".links p:eq(0)").replaceWith("<p><a href=" + accUrl + " target='_blank'>Go to SFDC Account</a></p>");
      this.$(".links p:eq(2)").replaceWith("<p><a href=" + userUrl + " target='_blank'>Go to SFDC User</a></p>");

      // Account Notes
      this.$(".acc_notes div").text(org.customField("zendesk_account_notes"));

      // Show warning if subscription is no longer active
      if (active === false) {
        this.$('.warning .red:eq(0)').show();
      }
      // Show warning if user is a recent detractor
      if (user.customField("user_ops_scores") <= 6 && user.customField("user_ops_scores") !== null) {
        this.$('.warning .orange:eq(0)').show();
      }
      // Show notification if subscription is in onboarding
      if (org.customField("account_in_onboarding") === true) {
        this.$('.warning .orange:eq(1)').show();
      }

      // List types of support the customer is eligible for

      // Display message that the organization is a strategic customer

      var plan = org.customField("subscription_plan");

      switch (true) {
        case null:
            this.$('#plan .11').show();
            break;
        case /bronze/.test(plan):
            this.$('#plan .1').show();
            break;
        case /silver/.test(plan):
            this.$('#plan .2').show();
            break;
        case /gold/.test(plan):
            this.$('#plan .3').show();
            break;
        case /platinum/.test(plan):
            this.$('#plan .4').show();
            break;
        case /enterprise_standard/.test(plan):
            this.$('#plan .5').show();
            break;
        case /enterprise_elite/.test(plan):
            this.$('#plan .6').show();
            break;
        case /enterprise_professional/.test(plan):
            this.$('#plan .7').show();
            break;
        case /enterprise_premium/.test(plan):
            this.$('#plan .8').show();
            break;
        case /enterprise/.test(plan):
            this.$('#plan .9').show();
            break;
        case /paygo/.test(plan):
            this.$('#plan .10').show();
            break;
        case /starter/.test(plan):
            this.$('#plan .11').show();
            break;
        default:
          this.$('#plan .13').show();
      }


    },

    renderUserRow: function() {
      //var subdomain = "optimizely1430953864";
      var subdomain = "optimizely";
      var user = this.ticket().requester();
      var userId = user.id();
      this.ajax('requestUserInfo', subdomain, userId).done(function() {
        this.switchTo("user");

        if (user.name()) {
          this.$('#right_col .1').text(user.name());
          this.$('.1').show();
        }
        if (user.customField("user_phone_number")) {
          this.$('#right_col .2').text(user.customField("user_phone_number"));
          this.$('.2').show();
        }
        if (user.customField("user_is_partner") === true) {
          this.$('#right_col .3').text("Yes");
          this.$('.3').show();
        }
        if (user.customField("platform_certified_user") === true) {
          this.$('#right_col .4').text("Yes");
          this.$('.4').show();
        }
        if (user.customField("developer_certified_user") === true) {
          this.$('#right_col .5').text("Yes");
          this.$('.5').show();
        }
        if (user.customField("tickets_closed_this_month").length > 0) {
          this.$('#right_col .6').text(user.customField("tickets_closed_this_month"));
          this.$('.6').show();
        }
        if (user.customField("user_ops_scores").length > 0) {
          this.$('#right_col .7').text(user.customField("user_ops_scores"));
          this.$('.7').show();
        }
        if (user.locale()) {
          this.$('#right_col .8').text(user.locale());
          this.$('.8').show();
        }
        if (user.timeZone()) {
          this.$('#right_col .9').text(user.timeZone().name());
          this.$('.9').show();
        }
      });


    },

    renderOrgRow: function() {
      var orgData;
      try {
        //var subdomain = "optimizely1430953864";
        var subdomain = "optimizely";
        var org = this.ticket().organization();
        var orgId = org.id();
        console.log(org);
        console.log(org.customField("subscription_mrr"));
        console.log(org.customField("churn_risk"));

        this.ajax('requestOrgInfo', subdomain, orgId).done(function() {
          this.switchTo("org");

          if (org.name()) {
            var name = org.name().split("-");
            this.$('#right_col .1').text(name[0]);
            this.$('.1').show();
          }
          if (org.customField("zendesk_assigned_csm")) {
            this.$('#right_col .2').text(org.customField("zendesk_assigned_csm"));
            this.$('.2').show();
          }
          if (org.customField("assigned_ae")) {
            this.$('#right_col .3').text(org.customField("assigned_ae"));
            this.$('.3').show();
          }
          if (org.customField("zendesk_managed_region")) {
            this.$('#right_col .4').text(org.customField("zendesk_managed_region"));
            this.$('.4').show();
          }
          if (org.customField("subscription_plan")) {
            this.$('#right_col .5').text(org.customField("subscription_plan"));
            this.$('.5').show();
          }
          if (org.customField("support_tier")) {
            this.$('#right_col .6').text(org.customField("support_tier"));
            this.$('.6').show();
          }
          if (org.customField("subscription_muvs")) {
            this.$('#right_col .7').text(org.customField("subscription_muvs"));
            this.$('.7').show();
          }
          if (org.customField("account_in_onboarding") === true) {
            this.$('#right_col .8').text(org.customField("account_in_onboarding"));
            this.$('.8').show();
          }
          if (org.customField("account_has_partner") === true) {
            this.$('#right_col .9').text(org.customField("partner_name"));
            this.$('.9').show();
          }
          if (org.customField("subscription_start_date")) {
            var subdate = org.customField("subscription_start_date").substr(0,10);
            this.$('#right_col .10').text(subdate);
            this.$('.10').show();
          }
          if (org.customField("subscription_end_date")) {
            var subenddate = org.customField("subscription_end_date").substr(0,10);
            this.$('#right_col .11').text(subenddate);
            this.$('.11').show();
          }
          if (org.customField("parent_account")) {
            this.$('#right_col .12').text(org.customField("parent_account"));
            this.$('.12').show();
          }
          if (typeof(org.customField("account_mrr")) !== undefined && org.customField("account_mrr") !== null) {
            this.$('#right_col .13').text(org.customField("account_mrr"));
            this.$('.13').show();
          }
          if (typeof(org.customField("subscription_mrr")) !== undefined && org.customField("subscription_mrr") !== null ) {
            this.$('#right_col .14').text(org.customField("subscription_mrr"));
            this.$('.14').show();
          }
          if (typeof(org.customField("churn_risk")) !== undefined && org.customField("churn_risk") !== null) {
            this.$('#right_col .15').text(org.customField("churn_risk"));
            this.$('.15').show();
          }

        });
      } catch (err) {
        orgData = {
          "message": "No organization defined"
        };
        this.switchTo("org", orgData);
      }
    },

    renderTicketRow: function() {
      //var subdomain = "optimizely1430953864";
      var subdomain = "optimizely";
      var ticket = this.ticket();
      var tags = ticket.tags();
      this.switchTo("ticket", ticket);
      this.getUserInfo();
    },

    showError: function() {
      this.switchTo('errorTemplate');
      console.log("fail");
    },

    updateAccNotes: function() {
      var curText = this.ticket().organization().customField("zendesk_account_notes");
      this.$("#acc_notes_input").css({"height":this.$(".acc_notes div").height(),"display":"inline-block"});
      this.$(".acc_notes div").hide();
      this.$("#acc_notes_input").val(curText);
    },

    saveAccNotes: function() {
      //var subdomain = "optimizely1430953864";
      var subdomain = "optimizely";
      var curText = this.$("#acc_notes_input").val();
      var org = this.ticket().organization();
      var orgId = org.id();
      org.customField("zendesk_account_notes", curText);

      this.ajax('updateOrgNotes', subdomain, orgId, org).done(function(data) {
        this.$(".acc_notes div").text(org.customField("zendesk_account_notes"));
        this.$("#acc_notes_input").hide();
        this.$(".acc_notes div").show();
      });
    },

    findOpenTickets: function() {
      // Find and display link/something when customer has other open tickets
    },

    /* 
    This function runs on ticket save & prevents tickets from being put on pending 
    when required fields are not filled. First check for the existence of "Managing Team",
    "Case Category" and "Case Type" to avoid errors on forms without these fields. If all 
    three are present, check that they contain a value. If at least one is not populated, 
    roll back the save & show an error popup.
    */
    checkFields: function() {
        var ticket = this.ticket();
        var status = ticket.status();
        console.log(status);
        if (status === "pending") {
          try {
            var manTeam = ticket.customField("custom_field_24732737");
            var caseCat = ticket.customField("custom_field_22597344");
            var caseType = ticket.customField("custom_field_21129370");
            console.log(manTeam,caseCat,caseType);
            console.log(manTeam.length,caseCat.length,caseType.length);

            // If no value selected, prevent save
            if (manTeam.length === 0 || caseCat.length === 0 || caseType.length === 0) {
              return "The ticket was not updated. Please check 'Managing Team', 'Case Category' and 'Case Type' are set before re-saving.";
            } else {
            }
          }

          // If one of the fields does not exist, save ticket regardless
          catch(err) {
            return true;
          }
        }
      }
  };

}());
