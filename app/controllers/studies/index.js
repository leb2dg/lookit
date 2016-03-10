
import Ember from 'ember';

const { service } = Ember.inject;

let Promise = Ember.ObjectProxy.extend(Ember.PromiseProxyMixin);

export default Ember.Controller.extend({
    session: service('session'),
    sessionAccount: service('session-account'),
    queryString: 'Active',
    queryTypes: ['state','eligibilityCriteria'],
    queryType: 'state',
    header: 'Suggested Studies',
    loggedIn: function() {
        if (this.get('sessionAccount').account) {
            return true;
        }
        return false;
    }.property(),
    allExperiments: function() {
        if (this.get('loggedIn')) {

            let Experiment = this.store.modelFor('experiment');

            let sessionGatherer = this.store.query('experiment', {
                q:`state:${Experiment.prototype.ACTIVE} OR state:${Experiment.prototype.ARCHIVED}`
            }).then((experiments) => {
                let self = this;
                let promises = [];
                let experimentSessions = [];

                experiments.forEach(function(experiment) {
                    // self.store.query(experiment.get('sessionCollectionId'), {'filter[completed]': 1})

                    // will only return sessions that user has permissions for
                    promises.push(self.store.findAll(experiment.get('sessionCollectionId')).then(function(session) {
                        let sessions = session.get('content');
                        if (sessions.length > 0) {
                            experimentSessions = experimentSessions.concat({
                                experiment: experiment,
                                sessions: sessions
                            });
                        }
                    }));
                });

                return Ember.RSVP.all(promises).then(function() {
                    return experimentSessions;
                });
            });

            return Promise.create({
                promise: sessionGatherer
            });
        }
        return [];
    }.property(),
    actions: {
        updateHeader: function(header) {
            this.set('header', header);
        }
    }
});
