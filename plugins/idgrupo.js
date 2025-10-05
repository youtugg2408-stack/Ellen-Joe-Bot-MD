let handler = async (m, { conn }) => {
  let id = m.chat
  let info = await conn.groupMetadata(id)
  console.log(info)
  m.reply(`El ID de este grupo es:\n${id}`)
}
handler.command = ['getid']
export default handler
