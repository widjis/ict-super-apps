import { listActiveDirectoryUsersPaginated } from '../../integrations/ldap/ldap.client.js';

export async function activeEmployeeIds(listUsers = listActiveDirectoryUsersPaginated, { signal } = {}) {
 const { users } = await listUsers({ activeOnly: true, pageSize: 500, ...(signal ? {signal} : {}) });
 // The directory listing intentionally does not apply LDAP_ALLOWED_GROUPS:
 // that policy controls login, not the missing-photo population.
 return [...new Set(users.map(user => user.employeeId)
  .filter(id => typeof id === 'string' && id.trim()).map(id => id.trim()))];
}
