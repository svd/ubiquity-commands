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
  newproject: "http://www.nozbe.com/api/newproject",
  newcontext: "http://www.nozbe.com/api/newcontext",
  newnote: "http://www.nozbe.com/api/newnote",

  whatnext: "http://www.nozbe.com/api/actions/what-next",
  whatproject: "http://www.nozbe.com/api/actions/what-project",
  whatcontext: "http://www.nozbe.com/api/actions/what-context",
  contexts: "http://www.nozbe.com/api/contexts",
  check: "http://www.nozbe.com/api/check"
};

Nozbe.PREF_API_KEY = "nozbe.api.key";

Nozbe.PREVIEW_COMMAND_LIMIT = 20;

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
    CmdUtils.log("Loaded Nozbe projects (" + Nozbe._projects.length + ")");
  }
  return Nozbe._projects;
}

Nozbe.getContexts = function() {
    if (Nozbe._contexts == null) {
        Nozbe._contexts = Nozbe.callNozbeAPI(Nozbe.NOZBE_URLS.contexts);
        CmdUtils.log("Loaded Nozbe contexts (" + Nozbe._contexts.length + ")");
    }
    return Nozbe._contexts;
}

Nozbe.resetCaches = function() {
  Nozbe._projects = null;
  Nozbe._contexts = null;
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

Nozbe.createProject = function(name, description) {
  var params = {name: name};
  if (description) {
	params["body"] = description;
  }
  Nozbe._projects = null;
  return Nozbe.callNozbeAPI(Nozbe.NOZBE_URLS.newproject, params);
}

Nozbe.createContext = function(name, description) {
  var params = {name: name};
  if (description) {
	params["body"] = description;
  }
  Nozbe._contexts = null;
  return Nozbe.callNozbeAPI(Nozbe.NOZBE_URLS.newcontext, params);
}

Nozbe.checkTask = function(id) {
	if (id) {
		return Nozbe.callNozbeAPI(Nozbe.NOZBE_URLS.check, {ids: id});
	} else {
		return null;
	}
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

Nozbe.PREVIEW_STYLE = 
	"<style type='text/css'>"
	+ ".content {}"
	+ ".items {/*background-color: #111111; color: #FFFFFF; opacity: 1;*/}"
	+ ".item {color: #000033;}"
	+ ".xxsmall {font-size: xx-small;}"
	+ ".xsmall {font-size: x-small;}"
	+ ".small {font-size: small; }"
	+ ".medium {font-size: medium; }"
	+ ".large {font-size: large; font-weight: bold;}"
	+ ".xlarge {font-size: x-large; font-weight: bold;}"
	+ ".xxlarge {font-size: xx-large; font-weight: bold;}"
	+ ".project > a:hover {text-decoration: underline;}"
	+ ".count {color: #E0E0E0; font-size: x-small;}"
	+ "</style>";
Nozbe.ITEMS_TEMPLATE = 
	Nozbe.PREVIEW_STYLE
	+ "<div class='content'>"
	+ "<div class='filter'>${filter}</div>"
	+ "<div class='items'>${items}</div>"
	+ "<div class='count'>Displayed ${matchCount} of ${count}</div>"
	+ "</div>"
	;
Nozbe.SIZE_STYLES = ["small","medium","large","xlarge","xxlarge"];

Nozbe.UNDONE_IMAGES = ["",
	"http://img.nozbe.com/undone-1.gif",
	"http://img.nozbe.com/undone-1.gif",
	"http://img.nozbe.com/undone-3.gif"
];

Nozbe.preparePreviewParams = function (items, filter, url) {
	filter = filter || "";
	var params = {items: "", filter: "", count: 0, matchCount: 0};
	var iData = "";
	var filtered = [];

	params.count = items.length;

	//params.filter = "Filter: \"" + filter + "\"";

	// Count items sizes
	var max = 0;
	for (var i in items) {
	    var cnt = parseInt(items[i].count)
		if (max < cnt) {
			max = cnt;
		}
		if (filter.length <= 0 || items[i].name.match(filter, "i")) {
			filtered.push(items[i]);
		}
	}

	params.matchCount = filtered.length;
	for (var i in filtered) {
		var item = filtered[i];
		cnt = parseInt(item.count);
		var sizeIndex =  parseInt( (Nozbe.SIZE_STYLES.length-1) * cnt / max );
		iData += "<span class='item " + Nozbe.SIZE_STYLES[sizeIndex] + "'>";
		if (url) {
			iData += "<a href='" + url + item.id + "'>";
		}
		iData += item.name + "&nbsp;(" + item.count + ")";
		if (url) {
			iData += "</a>";
		}
		iData += "</span>";
		if (i < filtered.length -1) {
			iData += " | ";
		}
	}
	params.items = iData;
	return params;
}

Nozbe.URL_ACTION = "http://img.nozbe.com/action.png";
Nozbe.URL_ACTION_NEXT = "http://img.nozbe.com/action-next.png";

// TODO: define styles for task list
Nozbe.TASKLIST_STYLE = 
	"<style type='text/css'>"
	+ ".content {}"
	+ ".items {/*background-color: #111111; color: #FFFFFF; opacity: 1;*/}"
	+ ".item {color: #000033;}"
	+ ".xxsmall {font-size: xx-small;}"
	+ ".xsmall {font-size: x-small;}"
	+ ".small {font-size: small; }"
	+ ".medium {font-size: medium; }"
	+ ".large {font-size: large; font-weight: bold;}"
	+ ".xlarge {font-size: x-large; font-weight: bold;}"
	+ ".xxlarge {font-size: xx-large; font-weight: bold;}"
	+ ".project > a:hover {text-decoration: underline;}"
	+ ".count {color: #E0E0E0; font-size: x-small;}"
	+ "</style>";

Nozbe.renderTask = function (task) {

  var result = "";
  var style="";

  var lblId = "lbl-"+task.id;
  result = result + "<input type='checkbox' class='task-checkbox' id='" + task.id + "'";
  if (task.done == 1) {
    style = "text-decoration: line-through; color:#aaaaaa;";
    result = result + " checked='true' disabled='true'";
  }
  
  result = result + "/>";

  if (task.next) {
    result = result + "&nbsp;<b><font color='red'>!</font></b>&nbsp;";
  } else {
    result = result + "&nbsp;<b><font color='#707070'>!</font></b>&nbsp;";
  }
    
  result = result + "<label id='" + lblId + "' for='" + task.id + "'>";
  result = result + "<span style='"+style+"'>" + task.name + "</span>";
  result = result + "</label>";

  result = result + "<font size='-2'>";
  if (task.project_name) {
	// color: lightgrey  = #C0C0C0
    result = result + "<font color='lightgrey'> [" + task.project_name + "]</font>";
  }
  if (task.context_name) {
	// color: pastel-green
    result = result + "<font color='#00FF00'> @" + task.context_name + "</font>";
  }
  if (task.time && task.time > 0) {
	// color: turquoise
    result = result + " <font color='#00FFFF'>(" + task.time + " min)</font>";
  }
  result = result + "</font>";
  return result;
}

noun_nozbe_project = {
    _name: "project",

    suggest: function(text, html) {
        var suggestions = [];
        var p = Nozbe.getProjects();
		if (!p) {
			return;
		}
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
    suggest: function(text, html) {
        var suggestions = [];
        var c = Nozbe.getContexts();
		if (!c) {
			return;
		}
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
	synonyms: ["task", "do"],
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
    description: "Adds a new task to Nozbe",
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
		Nozbe.resetCaches();
    }

});

CmdUtils.CreateCommand({
    name: "nozbe-complete",
	synonyms: ["done"],

	takes: {"filter": noun_arb_text},
	modifiers: {
		in: noun_nozbe_project,
		at: noun_nozbe_context
	},


    author: {
        name: "Sviatoslav Sviridov",
        email: "sviridov[at]gmail.com"
    },
    license: "GPL",
    description: "Mark a task as complete.",
    //help: "",
    icon: "http://secure.nozbe.com/img/nozbe-icon.png",

    execute: function(key) {
		displayMessage("Task nozbe-complete is not implemented yet");
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
    description: "Set your Nozbe API key.",
    help: "Type nozbe-setkey <nozbe-api_key>. Check your key at <a href='http://www.nozbe.com/account/extras'>http://www.nozbe.com/account/extras</a>",
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
  synonyms: ["list","what-next"],
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
    //var style = "style='background: #ddddff; color:black;'";
    var style = "style=''";
    var template = Nozbe.TASKLIST_STYLE
		+ "<div>"
		+ "<b>${title}</b>"
		+ "<div>${actions}</div>"
		+ "<div class='count'>Displayed ${matchCount} of ${count}</div>"
		+ "<div>&nbsp;</div>" //workaround to see last line when scrollbar is displayed
		+ "</div>";
    var params = {title:"", actions:"No actions found", more:"", link:""};
    var actions = {};
    var data = "";
    
    var modProject = mods["in"];
    var modContext = mods["at"];

    if (modProject && modProject.data) {
      params["link"] = "http://www.nozbe.com/account/projects/show-" + modProject.data ;
      params["title"] = "Actions in project: "
        //+ "<a style='text-decoration: underline;' href='" + params["link"] + "'>"
        + "<a href='" + params["link"] + "'>"
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
    if (!actions) {
	    actions = {};
    }
    // Group all action into  three categories: next, normal and done.
	var aNext = [], aNormal = [], aDone = [];
    for (var i in actions) {
		var a = actions[i];
		if (input.text.length <= 0 || a.name.match(input.text, "i")) {
			if (a.done == 1) {
				aDone.push(a);
			} else if (a.next) {
				aNext.push(a);
			} else {
				aNormal.push(a);
			}
		}
    }
    var cmds = 0;
	for (var i in aNext) {
		data += "<div>" + Nozbe.renderTask(aNext[i]) + "</div>";
		cmds += 1;
	}
	for (i in aNormal) {
		data += "<div>" + Nozbe.renderTask(aNormal[i]) + "</div>";
		cmds += 1;
	}
	for (i in aDone) {
		data += "<div>" + Nozbe.renderTask(aDone[i]) + "</div>";
		cmds += 1;
	}
    if (data) {
      params["actions"] = data;
    }
	params["matchCount"] = cmds;
	params["count"] = actions.length;
    var html = CmdUtils.renderTemplate(template, params);
    pblock.innerHTML = html;
	
	var J = jQuery;
	J(pblock).find(".task-checkbox").change(function() {
		//Utils.reportWarning("Hello from jQuery:" + this.id);
		var res = Nozbe.checkTask(this.id);
		if (res && res.response == "ok") {
		  J(pblock).find("label#lbl-"+this.id).css({color:"#aaaaaa", textDecoration:"line-through"});
		  J(this).attr("disabled","disabled");
		} else {
		  J(this).attr("checked", "");
		  displayMessage("Failed to mark task as done: " + this.id);
		}
	});
  },
  execute: function(input) {
    //CmdUtils.setSelection("You selected: "+input.html);
  }
});

CmdUtils.CreateCommand({
  name: "nozbe-projects",
  //synonyms: ["projects"],
  author: {name: "Sviatoslav Sviridov",email: "sviridov[at]gmail.com"},
  license: "GPL",
  description: "List available Nozbe projects",
  help: "Type nozbe-projects to get list of available projects. Click on the project name to open it in Nozbe",
  icon: "http://secure.nozbe.com/img/nozbe-icon.png",

  takes: {"filter": noun_arb_text},
  preview: function( pblock, input ) {
	var items = Nozbe.getProjects();
	var params = Nozbe.preparePreviewParams(items, input.text, "http://www.nozbe.com/account/projects/show-");
    pblock.innerHTML = CmdUtils.renderTemplate(Nozbe.ITEMS_TEMPLATE, params);
  },
  execute: function(input) {
  }
});

CmdUtils.CreateCommand({
  name: "nozbe-contexts",
  synonyms: ["contexts"],
  author: {name: "Sviatoslav Sviridov",email: "sviridov[at]gmail.com"},
  license: "GPL",
  description: "List available Nozbe contexts",
  help: "Type nozbe-contexts to get list of available context. Click on the context name to open it in Nozbe",
  icon: "http://secure.nozbe.com/img/nozbe-icon.png",

  takes: {"filter": noun_arb_text},
  preview: function( pblock, input ) {
	var items = Nozbe.getContexts();
	var params = Nozbe.preparePreviewParams(items, input.text, "http://www.nozbe.com/account/contexts/show-");
    pblock.innerHTML = CmdUtils.renderTemplate(Nozbe.ITEMS_TEMPLATE, params);
  },
  execute: function(input) {
  }
});

CmdUtils.CreateCommand({
  name: "nozbe-add-project",
  synonyms: ["new-project"],
  author: {name: "Sviatoslav Sviridov",email: "sviridov[at]gmail.com"},
  license: "GPL",
  description: "Create new project in Nozbe",
  help: "Type nozbe-add-project to create new project in Nozbe",
  icon: "http://secure.nozbe.com/img/nozbe-icon.png",

  takes: {"name": noun_arb_text},
  modifiers: {
    desc: noun_arb_text
  },

  preview1: function( pblock, name, mods ) {
    var template = "Will create a new project with name \"<b>${name}</b>\"";
	if (mods.desc.text) {
	  template += " and description \"<b>${desc}</b>\"";
	}
    pblock.innerHTML = CmdUtils.renderTemplate(template, {"name": name.text, "desc": mods.desc.text});
  },
  execute: function(name, mods) {
    if (name.text.length < 1) {
	  displayMessage("Please specify a project name");
	  return;
	}
    var desc = null;
	if (mods.desc.text && mods.desc.text.length > 0) {
	  desc = mods.desc.text;
	}
	var resp = Nozbe.createProject(name.text, desc);
	displayMessage("Project \"" + name.text + "\" has been created");
	Nozbe.resetCaches();
  }
});

/*
CmdUtils.CreateCommand({
  name: "nozbe-add-context",
  author: {name: "Sviatoslav Sviridov",email: "sviridov[at]gmail.com"},
  license: "GPL",
  description: "Create new context in Nozbe",
  help: "Type nozbe-add-context to create new context in Nozbe",
  icon: "http://secure.nozbe.com/img/nozbe-icon.png",

  takes: {"name": noun_arb_text},
  modifiers: {
    desc: noun_arb_text
  },

  preview: function( pblock, name, mods ) {
    var template = "Will create a new context with name \"<b>${name}</b>\"";
	if (mods.desc.text) {
	  template += " and description \"<b>${desc}</b>\"";
	}
    pblock.innerHTML = CmdUtils.renderTemplate(template, {"name": name.text, "desc": mods.desc.text});
  },
  execute: function(name, mods) {
    if (name.text.length < 1) {
	  displayMessage("Please specify a context name");
	  return;
	}
    var desc = null;
	if (mods.desc.text && mods.desc.text.length > 0) {
	  desc = mods.desc.text;
	}
	var resp = Nozbe.createContext(name.text, desc);
	displayMessage("Context \"" + name.text + "\" has been created");
	Nozbe.resetCaches();
  }
});
*/

CmdUtils.CreateCommand({
  name: "nozbe-reset",
  author: {name: "Sviatoslav Sviridov",email: "sviridov[at]gmail.com"},
  license: "GPL",
  description: "Clear cached lists of projects and contexts. This will force projects and contexts to be reloaded next time.",
  help: "Execute nozbe-reset command without parameters (any parameters are ignored).",
  icon: "http://secure.nozbe.com/img/nozbe-icon.png",

  /*takes: {"input": noun_arb_text},*/
  preview1: function( pblock, input ) {
    var template = "Clear cached lists of projects and contexts.";
    pblock.innerHTML = CmdUtils.renderTemplate(template, {});
  },
  execute: function(input) {
	Nozbe.resetCaches();
    displayMessage("Nozbe: caches reset");
  }
});
