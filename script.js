const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const STORAGE_KEY = 'estodolist_tarefas_v1';
let tasks = loadTasks();
let currentView = 'home';
let currentFilter = 'all';
let toastTimer;

function loadTasks() {
  try {
    /*esse const saved... serve para recuperar os dados já escritos, ou seja as tarefas já cadastradas*/
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(saved)) return saved;
  } catch (_) {}
  const samples = [
    {id: cryptoId(), name:'Estudar para prova de Matemática', description:'Revisar os capítulos 5 ao 8', date:dateOffset(0), priority:'Alta', category:'Estudos', done:false, created:Date.now()},
    {id: cryptoId(), name:'Trabalho de História', description:'Pesquisar sobre a Revolução Francesa', date:dateOffset(3), priority:'Média', category:'Estudos', done:false, created:Date.now()},
    {id: cryptoId(), name:'Leitura: Dom Casmurro', description:'Ler até o capítulo 10', date:dateOffset(6), priority:'Baixa', category:'Leitura', done:false, created:Date.now()},
    {id: cryptoId(), name:'Exercícios de Português', description:'Lista de exercícios 1 a 20', date:dateOffset(-1), priority:'Baixa', category:'Estudos', done:true, created:Date.now()},
    {id: cryptoId(), name:'Projeto de Programação', description:'Criar o protótipo do sistema', date:dateOffset(8), priority:'Alta', category:'Estudos', done:false, created:Date.now()}
  ];
  return samples;
}
function cryptoId(){return (window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2)}
function dateOffset(days){const d=new Date();d.setDate(d.getDate()+days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}

/*Esse fuction persist é utilizada para ser o banco de dados do próprio navergador, sem precisar usar a linguagem MSql, ou seja esse função salva os dados*/
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(tasks))}

function prettyDate(value){if(!value)return 'Sem prazo';const [y,m,d]=value.split('-');return `${d}/${m}/${y}`}

function today(){return dateOffset(0)}
function filteredByView(task){
  const date=task.date;
  if(currentView==='completed')return task.done;
  if(currentView==='today')return date===today()&&!task.done;
  if(currentView==='tomorrow')return date===dateOffset(1)&&!task.done;
  if(currentView==='week'){const now=new Date();const end=new Date();end.setDate(end.getDate()+7);return date&&new Date(date+'T00:00:00')>=new Date(today()+'T00:00:00')&&new Date(date+'T00:00:00')<=end&&!task.done}
  if(currentView==='nextweek'){const start=new Date();start.setDate(start.getDate()+7);const end=new Date();end.setDate(end.getDate()+14);return date&&new Date(date+'T00:00:00')>start&&new Date(date+'T00:00:00')<=end&&!task.done}
  if(currentView==='priorities')return !task.done;
  return true;
}
function getVisibleTasks(){
  const query=$('#searchInput').value.trim().toLocaleLowerCase('pt-BR');
  return tasks.filter(filteredByView).filter(t=>{
    const matchesFilter=currentFilter==='all'||(currentFilter==='pending'&&!t.done)||(currentFilter==='completed'&&t.done);
    const matchesQuery=!query||`${t.name} ${t.description} ${t.category}`.toLocaleLowerCase('pt-BR').includes(query);
    return matchesFilter&&matchesQuery;
  }).sort((a,b)=>{
    if(currentView==='priorities'){const order={Alta:0,'Média':1,Baixa:2};return order[a.priority]-order[b.priority]}
    if(a.done!==b.done)return a.done?1:-1;
    if(!a.date)return 1;if(!b.date)return -1;return a.date.localeCompare(b.date);
  });
}
function ensureTasksPanel(){
  const panel=$('.tasks-panel');
  if(panel&&!$('#taskList')){
    panel.innerHTML=`<div class="section-heading"><h2 id="listHeading">Sua lista</h2><span id="listCount">0 tarefas</span></div><div id="taskList" class="task-list"></div><div class="empty-state" id="emptyState"><div class="empty-illustration">☁️<span>✓</span></div><h3>Tudo tranquilo por aqui!</h3><p>Adicione uma tarefa e transforme seus planos em conquistas.</p><button class="primary-btn" id="emptyAdd">＋ Adicionar tarefa</button></div>`;
    $('#emptyAdd').addEventListener('click',openNewTask);
  }
}

function render(){
  ensureTasksPanel();
  const counts={all:tasks.length,pending:tasks.filter(t=>!t.done).length,completed:tasks.filter(t=>t.done).length};
  $('#countAll').textContent=counts.all;$('#countPending').textContent=counts.pending;$('#countCompleted').textContent=counts.completed;
  $('#listCount').textContent=`${getVisibleTasks().length} ${getVisibleTasks().length===1?'tarefa':'tarefas'}`;
  $('#todayCount').textContent=`${tasks.filter(t=>t.date===today()&&!t.done).length} tarefas`;
  $('#doneCount').textContent=`${counts.completed} tarefas`;
  $('#quickToday').textContent=`${tasks.filter(t=>t.date===today()&&!t.done).length} tarefas`;
  $('#quickTomorrow').textContent=`${tasks.filter(t=>t.date===dateOffset(1)&&!t.done).length} tarefas`;
  $('#quickWeek').textContent=`${tasks.filter(t=>{const d=t.date;return d&&d>=today()&&d<=dateOffset(7)&&!t.done}).length} tarefas`;
  $('#quickNextWeek').textContent=`${tasks.filter(t=>{const d=t.date;return d&&d>dateOffset(7)&&d<=dateOffset(14)&&!t.done}).length} tarefas`;
  const titles={home:['Minhas tarefas','Um passo de cada vez. Você consegue!','Sua lista'],today:['Tarefas de hoje','Vamos cuidar do que importa agora.','Para hoje'],tomorrow:['Tarefas de amanhã','Deixe o amanhã mais leve.','Para amanhã'],week:['Esta semana','Organize seus próximos passos.','Próximos 7 dias'],nextweek:['Semana que vem','Planeje com calma, realize com confiança.','Semana que vem'],completed:['Tarefas concluídas','Olha só o quanto você já fez!','Suas conquistas'],priorities:['Prioridades','Comece pelo que mais importa.','Por prioridade'],settings:['Configurações','Deixe seu espaço com a sua cara.','Preferências'],profile:['Meu perfil','Cada pequena conquista conta.','Seu progresso']};
  const config=titles[currentView]||titles.home;$('#pageTitle').innerHTML=config[0]+' <span class="wave">✦</span>';$('#pageSubtitle').textContent=config[1];$('#listHeading').textContent=config[2];
  $$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view===currentView));
  const list=$('#taskList');list.innerHTML='';
  const visible=getVisibleTasks();
  visible.forEach(task=>list.appendChild(createTaskElement(task)));
  $('#emptyState').classList.toggle('show',visible.length===0);
  $('#filterPills').style.display=['settings','profile'].includes(currentView)?'none':'flex';
  if(currentView==='settings'||currentView==='profile')renderSpecialView(currentView);
}
function createTaskElement(task){
  const article=document.createElement('article');article.className='task-item'+(task.done?' is-done':'');
  const check=document.createElement('input');check.type='checkbox';check.className='task-check';check.checked=task.done;check.setAttribute('aria-label',`Marcar ${task.name} como concluída`);
  check.addEventListener('change',()=>{task.done=check.checked;persist();render();showToast(task.done?'Tarefa concluída. Parabéns!':'Tarefa marcada como pendente.')});
  const main=document.createElement('div');main.className='task-main';
  const name=document.createElement('div');name.className='task-title';name.textContent=task.name;
  const desc=document.createElement('div');desc.className='task-desc';desc.textContent=task.description||task.category||'Sem descrição';
  const meta=document.createElement('div');meta.className='task-meta';
  const date=document.createElement('span');date.className='date';date.textContent='▦ '+prettyDate(task.date);
  const category=document.createElement('span');category.textContent='◦ '+task.category;
  meta.append(date,category);main.append(name,desc,meta);
  const badge=document.createElement('span');badge.className='priority-badge priority-'+task.priority.toLocaleLowerCase('pt-BR');badge.textContent=task.done?'Concluída':task.priority;
  const menu=document.createElement('button');menu.className='task-menu';menu.textContent='···';menu.title='Editar ou excluir tarefa';
  menu.addEventListener('click',()=>openTaskMenu(task));
  article.append(check,main,badge,menu);return article;
}
function openTaskMenu(task){
  fillForm(task);
}
function resetForm(){
  $('#taskForm').reset();$('#taskId').value='';$('#descCount').textContent='0';$('#formTitle').textContent='Cadastrar tarefa';$('#saveTask').textContent='▣ Salvar';$('#deleteTask').hidden=true;
  $('input[name="priority"][value="Média"]').checked=true;
}
function fillForm(task){
  $('#taskId').value=task.id;$('#taskName').value=task.name;$('#taskDescription').value=task.description||'';$('#taskDate').value=task.date||'';$('#taskCategory').value=task.category||'Estudos';const radio=$(`input[name="priority"][value="${task.priority}"]`);if(radio)radio.checked=true;
  $('#descCount').textContent=$('#taskDescription').value.length;$('#formTitle').textContent='Editar tarefa';$('#saveTask').textContent='Salvar alterações';$('#deleteTask').hidden=false;
  $('#taskFormCard').scrollIntoView({behavior:'smooth',block:'center'});$('#taskName').focus();
}
function openNewTask(){resetForm();$('#taskFormCard').scrollIntoView({behavior:'smooth',block:'center'});$('#taskName').focus()}
function showToast(message){const toast=$('#toast');toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2600)}
function renderSpecialView(view){
  const panel=$('.tasks-panel');if(!panel)return;
  if(view==='settings'){panel.innerHTML=`<div class="section-heading"><h2>Preferências</h2></div><div class="setting-row"><span>☾</span><div><b>Tema escuro</b><small>Um visual confortável para estudar à noite.</small></div><button class="secondary-btn" id="settingsTheme">Alternar</button></div><div class="setting-row"><span>♧</span><div><b>Notificações</b><small>Em uma versão web local, lembretes automáticos não são enviados.</small></div></div><div class="setting-row"><span>♡</span><div><b>Seus dados</b><small>As tarefas ficam salvas neste navegador.</small></div><button class="secondary-btn" id="exportTasks">Exportar</button></div>`;
    $('#settingsTheme')?.addEventListener('click',toggleTheme);$('#exportTasks')?.addEventListener('click',exportTasks);
  }else if(view==='profile'){const done=tasks.filter(t=>t.done).length;panel.innerHTML=`<div class="profile-view"><div class="profile-avatar">F</div><h2>Flavianny Santos</h2><p>Estudante • Organizando sonhos e tarefas.</p><blockquote>“O essencial é invisível aos olhos, e só se vê bem com o coração.”</blockquote><div class="profile-stats"><div><strong>${tasks.length}</strong><small>Tarefas cadastradas</small></div><div><strong>${done}</strong><small>Concluídas</small></div><div><strong>${tasks.length?Math.round(done/tasks.length*100):0}%</strong><small>Progresso</small></div></div><button class="primary-btn" id="profileAdd">＋ Nova tarefa</button></div>`;$('#profileAdd')?.addEventListener('click',()=>{currentView='home';render();openNewTask()});}
}
function toggleTheme(){document.body.classList.toggle('dark');$('#themeToggle').textContent=document.body.classList.contains('dark')?'☀':'☾';localStorage.setItem('estodolist_dark',document.body.classList.contains('dark')?'1':'0')}
function exportTasks(){const blob=new Blob([JSON.stringify(tasks,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='estodolist-tarefas.json';a.click();URL.revokeObjectURL(url);showToast('Arquivo de tarefas exportado!')}
function setView(view){currentView=view;currentFilter='all';$$('.filter-pill').forEach(b=>b.classList.toggle('active',b.dataset.filter==='all'));render();window.scrollTo({top:0,behavior:'smooth'})}

$('#taskForm').addEventListener('submit',event=>{
  event.preventDefault();const name=$('#taskName').value.trim();if(!name){$('#taskName').focus();return}
  const id=$('#taskId').value;const task={id:id||cryptoId(),name,description:$('#taskDescription').value.trim(),date:$('#taskDate').value,category:$('#taskCategory').value,priority:$('input[name="priority"]:checked').value,done:false,created:Date.now()};
  if(id){const old=tasks.find(t=>t.id===id);if(old){task.done=old.done;task.created=old.created;tasks=tasks.map(t=>t.id===id?task:t)}showToast('Alterações salvas com sucesso!')}
  else{tasks.unshift(task);showToast('Tarefa adicionada com sucesso!')}
  persist();resetForm();currentView='home';currentFilter='all';render();
});
$('#taskDescription').addEventListener('input',()=>$('#descCount').textContent=$('#taskDescription').value.length);
$('#deleteTask').addEventListener('click',()=>{const id=$('#taskId').value;const task=tasks.find(t=>t.id===id);if(!task)return;tasks=tasks.filter(t=>t.id!==id);persist();resetForm();render();showToast('Tarefa excluída com sucesso!')});
$('#cancelForm').addEventListener('click',()=>{resetForm();showToast('Edição cancelada.')});
$('#closeForm').addEventListener('click',()=>{resetForm();showToast('Formulário fechado.')});
$('#newTaskTop').addEventListener('click',openNewTask);$('#emptyAdd').addEventListener('click',openNewTask);
$('#searchInput').addEventListener('input',render);
$('#filterPills').addEventListener('click',event=>{const btn=event.target.closest('[data-filter]');if(!btn)return;currentFilter=btn.dataset.filter;$$('.filter-pill').forEach(b=>b.classList.toggle('active',b===btn));render()});
document.addEventListener('click',event=>{const nav=event.target.closest('[data-view]');if(nav)setView(nav.dataset.view)});
$('#themeToggle').addEventListener('click',toggleTheme);
if(localStorage.getItem('estodolist_dark')==='1'){document.body.classList.add('dark');$('#themeToggle').textContent='☀'}
const extraStyle=document.createElement('style');extraStyle.textContent=`.setting-row{display:flex;align-items:center;gap:13px;padding:17px 8px;border-bottom:1px solid var(--line)}.setting-row>span{font-size:22px;color:var(--purple)}.setting-row div{display:grid;gap:4px;flex:1}.setting-row small{font-size:12px;color:var(--muted)}.setting-row .secondary-btn{padding:8px 12px}.profile-view{text-align:center;padding:15px}.profile-avatar{width:82px;height:82px;margin:auto;border-radius:50%;display:grid;place-items:center;background:linear-gradient(140deg,#d7c5ff,#9c7ce1);color:white;font-size:36px;font-weight:900}.profile-view h2{margin:13px 0 3px}.profile-view>p{color:var(--muted)}.profile-view blockquote{margin:20px auto;padding:15px;background:#f5f0ff;border-radius:12px;color:#7661a5;font-style:italic;max-width:390px}.profile-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:20px 0}.profile-stats div{display:grid;gap:4px;padding:13px 4px;border:1px solid var(--line);border-radius:12px}.profile-stats strong{font-size:22px;color:var(--purple)}.profile-stats small{font-size:10px;color:var(--muted)}body.dark .profile-view blockquote{background:#3a2d52;color:#d2c3f2}`;document.head.appendChild(extraStyle);
persist();render();
