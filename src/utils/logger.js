export function dialogConnect(db, col) {
  return `
{#00ff00-fg}● Connected{/}
{bold}Database{/}   : ${db}
{bold}Collection{/} : ${col ?? "-"}
`;
}
