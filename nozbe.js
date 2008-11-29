Nozbe = function() {}

Nozbe.NOZBE_URLS = {
    projects: "http://www.nozbe.com/api/projects",

  /*
parameters for newaction
- name - action/project/note name (url-encoded)
- body - project/note body (url-encoded)
- project_id - id of the project
- context_id - id of the context
- time - time in minutes (action only, values: 5,15,30,60,90,120,180...)
- next - if sent, action will be added to "next actions" list
*/
    newaction: "http://www.nozbe.com/api/newaction",

  /*
  Parameters for what-next: none
  */
  whatnext: "http://www.nozbe.com/api/actions/what-next",
  whatproject: "http://www.nozbe.com/api/actions/what-project",
  whatcontext: "http://www.nozbe.com/api/actions/what-context",
  newnote: "http://www.nozbe.com/api/newnote/name-test/body-test/project_id-c4ca1/context_id-c4ca1/key-",
  contexts: "http://www.nozbe.com/api/contexts"
};

Nozbe.PREF_API_KEY = "nozbe.api.key";

Nozbe._projects = null;
Nozbe._contexts = null;

Nozbe.authorizeNozbeURL = function(url) {
    if (url == null) {
        return null;
    };
    return url + '/key-' + Nozbe.getAPIKey();
}

Nozbe.buildUrl = function(url, params) {
  if (params) {
    for (p in params) {
      url = url + "/" + p + "-" + params[p];
    }
  }
  //displayMessage("Build url: " + url);
  return url;
}
 
Nozbe.callNozbeAPI = function(url, params) {
  //url = Nozbe.authorizeNozbeURL(url);
  if (!params) {
    params = {};
  }
  params["key"] = Nozbe.getAPIKey();

  url = Nozbe.buildUrl(url,params);

    var result = null;
    jQuery.ajax({
        type: "GET",
        url: url,
        async: false,
        dataType: "json",
        error: function() {
            displayMessage("Error occured while calling Nozbe API: " + url);
        },
        success: function(responseData) {
            result = responseData;
        }
    });
    return result;
}

Nozbe.getProjects = function() {
    if (Nozbe._projects == null) {
        Nozbe._projects = Nozbe.callNozbeAPI(Nozbe.NOZBE_URLS.projects);
//displayMessage("Loaded Nozbe projects (" + Nozbe._projects.length + ")");
    }
    return Nozbe._projects;
}

Nozbe.getContexts = function() {
    if (Nozbe._contexts == null) {
        Nozbe._contexts = Nozbe.callNozbeAPI(Nozbe.NOZBE_URLS.contexts);
    }
    return Nozbe._contexts;
}

Nozbe.getNextActions = function() {
  return Nozbe.callNozbeAPI(Nozbe.NOZBE_URLS.whatnext);
}

Nozbe.getTasksInProject = function(project) {
  return Nozbe.callNozbeAPI(Nozbe.NOZBE_URLS.whatproject, {id: project});
}
  
Nozbe.getTasksInContext = function(context) {
  return Nozbe.callNozbeAPI(Nozbe.NOZBE_URLS.whatcontext, {id: context});
}
  
Nozbe.setAPIKey = function(key) {
    if (!Application.prefs.has(Nozbe.PREF_API_KEY)) {
        Application.prefs.setValue(Nozbe.PREF_API_KEY, key);
        return key;
    } else {
        var new_key = Application.prefs.get(Nozbe.PREF_API_KEY);
        new_key.value = key;
        return new_key.value;
    }
}

Nozbe.getAPIKey = function(key) {
    return Application.prefs.get(Nozbe.PREF_API_KEY).value;
}

Nozbe.loadNozbeProjects = function(callback) {
    var projects = Nozbe.getProjects();
    callback(projects);
}

Nozbe.loadNozbeContexts = function(callback) {
    var contexts = Nozbe.getContexts();
    callback(contexts);
}

Nozbe.renderTask = function (task) {
  var result = "";
  var style="";

  if (task.done == 1) {
    style = "text-decoration: line-through; color:#aaaaaa;";
  }
  result = result + "<span style='"+style+"'>" + task.name + "</span>";

  result = result + "<font size='-2'>";
  if (task.project_name) {
    result = result + "<font color='grey'> [" + task.project_name + "]</font>";
  }
  if (task.context_icon) {
    result = result + " <img src='http://img.nozbe.com/" + task.context_icon + "'>";
    if (task.context_name) {
      result = result + "<font color='green'> @" + task.context_name + "</font>";
    }
    result = result + "</img>";
  }
  if (task.time && task.time > 0) {
    result = result + " <font color='blue'>(" + task.time + " min)</font>";
  }
  result = result + "</font>";
  return result;
}

noun_nozbe_project = {
    _name: "project",
    _projects: null,

    callback: function(projects) {
        noun_nozbe_project._projects = projects;
    },

    suggest: function(text, html) {
        if (noun_nozbe_project._projects == null) {
            Nozbe.loadNozbeProjects(noun_nozbe_project.callback);
        }

        var suggestions = [];
        var p = noun_nozbe_project._projects;
        for (var i in p) {
            if (p[i].name.match(text, "i")) {
                suggestions.push(CmdUtils.makeSugg(p[i].name, null, p[i].id));
            }
        }
        return suggestions.splice(0, 15);
    }
}

noun_nozbe_context = {
    _name: "context",
    _contexts: null,

    callback: function(contexts) {
        noun_nozbe_project._contexts = contexts;
    },

    suggest: function(text, html) {
        if (noun_nozbe_project._contexts == null || true) {
            Nozbe.loadNozbeContexts(noun_nozbe_context.callback);
        }

        var suggestions = [];
        var c = noun_nozbe_project._contexts;
        for (var i in c) {
            if (c[i].name.match(text, "i")) {
                suggestions.push(CmdUtils.makeSugg(c[i].name, null, c[i].id));
            }
        }
        return suggestions.splice(0, 15);
    }
}

CmdUtils.CreateCommand({
    name: "nozbe",
    takes: {
        action: noun_arb_text
    },
    modifiers: {
        to: noun_nozbe_project,
        at: noun_nozbe_context
    },

    author: {
        name: "Sviatoslav Sviridov",
        email: "sviridov[at]gmail.com"
    },
    license: "GPL",
    description: "Adds a task to your nozbe account",

    _urls: Nozbe.NOZBE_URLS,

    _getDefProject: function(projects) {
        if (projects == null || projects.length < 1) {
            return null;
        }
    },

    preview: function(pblock, action) {
        pblock.innerHTML = "Will add action to Nozbe: " + action.text;
    },

    execute: function(statusText, mods) {
        if (statusText.text.length < 1) {
            displayMessage("Nozbe requires a task to be entered");
            return;
        }
//displayMessage("Adding action " + statusText.text
//+ " to "  + mods.to.text + ":" + mods.to.data
//+" at " + mods.at.text + ":" + mods.at.data);

          
        var updateUrl = this._urls.newaction;
        updateUrl = updateUrl + "/name-" + encodeURIComponent(statusText.text);

        if (mods.to.data) {
            updateUrl = updateUrl + "/project_id-" + mods.to.data;
        } else {
            // Nozbe requires project_id to be specified always
            var projects = Nozbe.getProjects();
            updateUrl = updateUrl + "/project_id-" + projects[0].id;
        }

        if (mods.at.data) {
            updateUrl = updateUrl + "/context_id-" + mods.at.data;
        }

        var updateParams = {
            source: "ubiquity",
            status: statusText.text
        };

        var result = Nozbe.callNozbeAPI(updateUrl);
        displayMessage("Nozbe action created: " + statusText.text);
    }

});

CmdUtils.CreateCommand({
    name: "nozbe-setkey",
    takes: {
        key: noun_arb_text
    },

    author: {
        name: "Sviatoslav Sviridov",
        email: "sviridov[at]gmail.com"
    },
    license: "GPL",
    description: "Set your Nozbe API key. Check your key at http://www.nozbe.com/account/extras",
    help: "Type nozbe-setkey . Check your key at http://www.nozbe.com/account/extras",

    execute: function(key) {
        if (key.text.length < 1) {
            displayMessage("Please, enter your key");
            return;
        }

        Nozbe.setAPIKey(key.text);
        displayMessage("Your api key has been set.");
    }
});

CmdUtils.CreateCommand({
  name: "nozbe-list",
/*  icon: "http://example.com/example.png",
  homepage: "http://example.com/", */
  author: {name: "Sviatoslav Sviridov",email: "sviridov[at]gmail.com"},
  license: "GPL",
  description: "Get list of next actions from Nozbe",
  help: "Type nozbe-list to get list of next actions",

  takes: {"filter": noun_arb_text},
  modifiers: {
    in: noun_nozbe_project,
    at: noun_nozbe_context
  },

  preview: function( pblock, input, mods) {
    //var template = "${title}\n${actions}";
    var style = "style='background: #ddddff; color:black;'";
    var template = "<div " + style + "><b>${title}</b>\n<font><div>${actions}</div></font></div>";
    var params = {title:"", actions:"No actions found"};
    var actions = {};
    var data = "";
    var dataDone = "";
    
    var proj = "";
    var modProject = mods["in"];
    var modContext = mods["at"];

    if (modProject && modProject.data) {
      params["title"] = "Actions in project: " + modProject.text;
      actions = Nozbe.getTasksInProject(modProject.data);
    } else if (modContext && modContext.data) {
      params["title"] = "Actions in context: " + modContext.text;
      actions = Nozbe.getTasksInContext(modContext.data);
    } else {
      params["title"] = "Next actions:";
      actions = Nozbe.getNextActions();
    }
    for (var i in actions) {
      var a = actions[i];
      var text = "";
      if (input.text.length > 0) {
        if (a.name.match(input.text, "i")) {
          text = Nozbe.renderTask(a);
        }
      } else {
        text = Nozbe.renderTask(a);
      }
      if (a.done == 1) {
        dataDone = dataDone + "<div>" + text + "</div>";
      } else {
        data = data + "<div>" + text + "</div>";
      }
    }
    data = data + dataDone;
    if (data) {
      params["actions"] = data;
    }
    pblock.innerHTML = CmdUtils.renderTemplate(template, params);
  },
  execute: function(input) {
    CmdUtils.setSelection("You selected: "+input.html);
  }
});

