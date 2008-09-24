Nozbe = function() {}

Nozbe.NOZBE_URLS = {
    projects: "http://www.nozbe.com/api/projects",
    newaction: "http://www.nozbe.com/api/newaction",
/*
parameters for newaction
- name - action/project/note name (url-encoded)
- body - project/note body (url-encoded)
- project_id - id of the project
- context_id - id of the context
- time - time in minutes (action only, values: 5,15,30,60,90,120,180...)
- next - if sent, action will be added to "next actions" list 
*/

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

Nozbe.callNozbeAPI = function(url) {
    url = Nozbe.authorizeNozbeURL(url);
    var result = null;
    jQuery.ajax({
        type: "GET",
        url: url,
        async: false,
        dataType: "json",
        error: function() {
            displayMessage("Error occured while calling Nozbe API");
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

function loadNozbeContexts(callback) {
    var contexts = Nozbe.getContexts();
    callback(contexts);
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
            loadNozbeContexts(noun_nozbe_context.callback);
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
        displayMessage("Nozbe action created: " + result[0].name);
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
