'use strict';

const INTERNAL_EMAIL_DOMAIN = '@rgipt.ac.in';

function getParticipantType(email) {
  return String(email || '').trim().toLowerCase().endsWith(INTERNAL_EMAIL_DOMAIN)
    ? 'internal'
    : 'external';
}

function participantTypeLabel(type) {
  return type === 'internal' ? 'Internal' : 'External';
}

module.exports = { getParticipantType, participantTypeLabel };
