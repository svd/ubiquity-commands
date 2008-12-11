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

  whatnext: "http://www.nozbe.com/api/actions/what-next",
  whatproject: "http://www.nozbe.com/api/actions/what-project",
  whatcontext: "http://www.nozbe.com/api/actions/what-context",
  newnote: "http://www.nozbe.com/api/newnote/name-test/body-test/project_id-c4ca1/context_id-c4ca1/key-",
  contexts: "http://www.nozbe.com/api/contexts",
  check: "http://www.nozbe.com/api/check"
};

Nozbe.PREF_API_KEY = "nozbe.api.key";

Nozbe.PREVIEW_COMMAND_LIMIT = 10;

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
    //CmdUtils.log("Loaded Nozbe projects (" + Nozbe._projects.length + ")");
    displayMessage("Loaded Nozbe projects (" + Nozbe._projects.length + ")");
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

Nozbe.URL_ACTION = "http://img.nozbe.com/action.png";
Nozbe.URL_ACTION_NEXT = "http://img.nozbe.com/action-next.png";

Nozbe.renderTask = function (task) {
  var result = "";
  var style="";
  var cl = "task";

  var lblId = "lbl-"+task.id;
  result = result + "<input type='checkbox' id='" + task.id + "'";
  if (task.done == 1) {
    style = "text-decoration: line-through; color:#aaaaaa;";
	cl = cl + " task-done";
    result = result + " checked='true' disabled='true'";
  }
  var checkUrl = Nozbe.NOZBE_URLS.check
      + "/ids-" + task.id
      + "/key-" + Nozbe.getAPIKey();
  var onChangeJS = "javascript:var r=new XMLHttpRequest();"
      + "r.onreadystatechange=function(){"
      +   "if(r.readyState  == 4){"
      +     "if(r.status  == 200){"
      +       "var e=document.getElementById(\""+lblId+"\");"
      +       "e.style.color=\"#aaaaaa\";e.style.textDecoration=\"line-through\";"
      +     "}"
      +   "}"
      + "};"
      + "e=document.getElementById(\""+task.id+"\");e.disabled=\"true\";"      
      + "r.open(\"GET\", \""+ checkUrl +"\", true);"
      + "r.send(null);"
      ;
  
  result = result + " onchange='" + onChangeJS + "'";
  result = result + "/>";

  if (task.next) {
    result = result + "<img src='http://img.nozbe.com/action-next.png'/>";
  } else {
    result = result + "<img src='http://img.nozbe.com/action.png'/>"
  }
    
  result = result + "<label id='" + lblId + "' for='" + task.id + "'>";
  result = result + "<span class='"+cl+"'>" + task.name + "</span>";
  result = result + "</label>";

  if (task.project_name) {
    result = result + "<span class='project'> [" + task.project_name + "]</span>";
  }
//  if (task.context_icon) {
//    result = result + " <img src='http://img.nozbe.com/" + task.context_icon + "'/>";
//  }
  if (task.context_name) {
    result = result + "<span class='context'> @" + task.context_name + "</span>";
  }
  if (task.time && task.time > 0) {
    result = result + " <span class='time'>(" + task.time + " min)</span>";
  }
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
                suggestions.push(CmdUtils.makeSugg(p[i].name + " (" + p[i].count + ")", null, p[i].id));
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
                suggestions.push(CmdUtils.makeSugg(c[i].name + " (" + c[i].count + ")", null, c[i].id));
            }
        }
        return suggestions.splice(0, 15);
    }
}

CmdUtils.CreateCommand({
    name: "nozbe-add",
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
    icon: "http://secure.nozbe.com/img/nozbe-icon.png",

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
    icon: "http://secure.nozbe.com/img/nozbe-icon.png",

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
/*  homepage: "http://example.com/", */
  author: {name: "Sviatoslav Sviridov",email: "sviridov[at]gmail.com"},
  license: "GPL",
  description: "Get list of next actions from Nozbe",
  help: "Type nozbe-list to get list of next actions",
  icon: "http://secure.nozbe.com/img/nozbe-icon.png",

  takes: {"filter": noun_arb_text},
  modifiers: {
    in: noun_nozbe_project,
    at: noun_nozbe_context
  },

  preview: function( pblock, input, mods) {
    var style = "style='background: #ddddff; color:black;'";
    var template = "<div " + style + "><b>${title}</b><div><font>${actions}</font></div><div>${more}</div></div>"
        + "</body></html>";
    var params = {title:"", actions:"No actions found", more:"", link:""};
    var actions = {};
    var data = "";
    var dataDone = [];
    var cmds = 0;
    
    var modProject = mods["in"];
    var modContext = mods["at"];

    if (modProject && modProject.data) {
      params["link"] = "http://www.nozbe.com/account/projects/show-" + modProject.data ;
      params["title"] = "Actions in project: "
        + "<a style='text-decoration: underline;' href='" + params["link"] + "'>"
        + modProject.text + "</a>";
      actions = Nozbe.getTasksInProject(modProject.data);
    } else if (modContext && modContext.data) {
      params["link"] = "http://www.nozbe.com/account/contexts/show-" + modContext.data ;
      params["title"] = "Actions in context: "
        + "<a style='text-decoration: underline;' href='" + params["link"] + "'>"
        + modContext.text + "</a>";
      actions = Nozbe.getTasksInContext(modContext.data);
    } else {
      params["link"] = "http://www.nozbe.com/account/next";
      params["title"] = "<a style='text-decoration: underline;' href='"
        + params["link"] + "'>Next actions</a>:";
      actions = Nozbe.getNextActions();
    }
    for (var i in actions) {
      var a = actions[i];
      var text = Nozbe.renderTask(a);
      if (input.text.length > 0) {
        if (a.name.match(input.text, "i")) {
          if (a.done == 1) {
            dataDone[dataDone.length] = "<div>" + text + "</div>";
          } else {
            data = data + "<div>" + text + "</div>";
            cmds += 1;
          }
        }
      } else {
        if (a.done == 1) {
          dataDone[dataDone.length] = "<div>" + text + "</div>";
        } else {
          data = data + "<div>" + text + "</div>";
          cmds += 1;
        }
      }
      if (cmds >= Nozbe.PREVIEW_COMMAND_LIMIT) {
        break;
      }
    }
    for (var i in dataDone) {
      if (cmds >= Nozbe.PREVIEW_COMMAND_LIMIT) {
        break;
      }
      data += dataDone[i];
      cmds += 1;
    }
    if (data) {
      params["actions"] = data;
    }
    if (cmds < actions.length) {
      params["more"] = "" + (actions.length  - cmds) + " more available";
    }
    //var html = CmdUtils.renderTemplate(template, params);
	var html = CmdUtils.renderTemplate({file:"nozbe-list.html"}, params);
    //Utils.reportWarning("Rendered template:" + html);
    pblock.innerHTML = html
  },
  execute: function(input) {
    CmdUtils.setSelection("You selected: "+input.html);
  }
});

CmdUtils.CreateCommand({
  name: "nozbe-reset",
  author: {name: "Sviatoslav Sviridov",email: "sviridov[at]gmail.com"},
  license: "GPL",
  description: "Clear cached lists of projects and contexts. This will force projects and contexts to be reloaded next time.",
  help: "Type nozbe-reset to clear caches",
  icon: "http://secure.nozbe.com/img/nozbe-icon.png",

  /*takes: {"input": noun_arb_text},*/
  preview: function( pblock, input ) {
    var template = "Clear cached lists of projects and contexts.";
    pblock.innerHTML = CmdUtils.renderTemplate(template, {});
  },
  execute: function(input) {
    Nozbe._projects = null;
    Nozbe._contexts = null;
    displayMessage("Nozbe: cache reset");
  }
});
