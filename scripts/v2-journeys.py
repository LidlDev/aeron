"""V2 browser regression journeys: catalogue/builder, canonical strength, migration,
calendar actions, sport profiles, analytics tabs, mobile/desktop layout, and WebGL fallback.
Run against a built app with AERON_URL=http://localhost:3001.
"""
import os,json,pathlib
from playwright.sync_api import sync_playwright,expect
BASE=os.environ.get('AERON_URL','http://localhost:3001').rstrip('/')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium') or None,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
 page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
 def go(route,title):
  page.goto(BASE+'/#/'+route,wait_until='domcontentloaded')
  expect(page.get_by_role('heading',name=title,exact=True)).to_be_visible()
 def db():return page.evaluate("JSON.parse(localStorage.getItem('aeron.database.v2'))")
 def report(s):print('PASS',s,flush=True)
 go('strength','Strength training')
 page.get_by_role('button',name='Exercise library',exact=True).click()
 expect(page.locator('.catalogue-heading>strong')).to_have_text('1,330 exercises',timeout=30000)
 page.get_by_label('Search exercises',exact=True).fill('3/4 sit-up')
 expect(page.locator('.exercise-catalogue>button')).to_have_count(1)
 page.locator('.exercise-catalogue>button').click()
 expect(page.get_by_role('dialog').get_by_role('heading',name='3/4 sit-up',exact=True)).to_be_visible()
 expect(page.get_by_role('dialog').get_by_text('Technique',exact=True)).to_be_visible()
 page.get_by_role('button',name='Close dialog',exact=True).click()
 report('OpenGym text catalogue loads, searches and opens detailed instructions')
 page.get_by_role('button',name='Build workout',exact=True).click()
 dlg=page.get_by_role('dialog')
 dlg.get_by_label('Strength workout name',exact=True).fill('Endurance test')
 dlg.get_by_label('Add exercise',exact=True).select_option('og:0001')
 dlg.get_by_label('Working sets · exercise 1',exact=True).fill('2')
 dlg.get_by_label('Target reps · exercise 1',exact=True).fill('10')
 dlg.get_by_label('Load (kg) · exercise 1',exact=True).fill('15')
 dlg.get_by_label('Rest seconds · exercise 1',exact=True).fill('0')
 dlg.get_by_role('button',name='Save strength workout',exact=True).click()
 page.get_by_role('button',name='Training',exact=True).click()
 page.get_by_role('button',name='Start Strength Endurance test',exact=True).click()
 log=next(l for l in db()['strengthLogs'].values() if not l['completed']);sid=log['sessionId']
 page.get_by_label('3/4 sit-up set 2 reps',exact=True).fill('12')
 page.get_by_label('3/4 sit-up set 2 weight in kg',exact=True).fill('20')
 page.get_by_role('button',name='Complete 3/4 sit-up set 2',exact=True).click()
 assert db()['strengthLogs'][log['id']]['restEndsAt'] <= page.evaluate('Date.now()')+100
 page.get_by_role('button',name='Pause session',exact=True).click()
 page.reload();expect(page.get_by_role('button',name='Resume session',exact=True)).to_be_visible()
 assert db()['strengthLogs'][log['id']]['sets'][1]['weight']==20
 page.get_by_role('button',name='Resume session',exact=True).click()
 page.get_by_role('button',name='Complete 3/4 sit-up set 3',exact=True).click()
 page.get_by_label('Recorded session duration (minutes)',exact=True).fill('42')
 page.get_by_label('Session notes',exact=True).fill('Controlled effort; no extra sets.')
 page.get_by_role('button',name='Complete strength session',exact=True).click()
 assert db()['sessions'][sid]['status']=='completed'
 assert db()['activities']['activity-'+sid]['minutes']==42
 page.get_by_role('button',name='History & records',exact=True).click()
 page.locator('.history-exercise').filter(has_text='3/4 sit-up').first.click()
 expect(page.get_by_role('dialog').get_by_text('20kg × 12',exact=True)).to_be_visible()
 page.get_by_role('button',name='Close dialog',exact=True).click()
 report('Build → log working sets → pause/reload/resume → complete same calendar session → exercise history')
 # A planned strength session retains its original identity through dedicated execution.
 data=db();scheduled=next(s for s in data['sessions'].values() if s['status']=='planned' and data['workouts'][s['workoutId']]['sport']=='Strength')
 go('strength?session='+scheduled['id'],'Strength training')
 page.get_by_role('button',name='Training',exact=True).click()
 page.get_by_role('button',name='Start scheduled session',exact=True).click()
 active=next(l for l in db()['strengthLogs'].values() if not l['completed']);assert active['sessionId']==scheduled['id']
 old_name=db()['exercises'][active['sets'][0]['exerciseId']]['name']
 page.get_by_label('Substitute exercise',exact=True).select_option('ex-6')
 expect(page.get_by_role('heading',name='Reverse lunge',exact=True)).to_be_visible()
 page.get_by_role('button',name='Next exercise',exact=True).click()
 page.get_by_role('button',name='Previous',exact=True).click()
 page.get_by_role('button',name='Complete Reverse lunge set 2',exact=True).click()
 page.get_by_role('button',name='Complete strength session',exact=True).click()
 assert db()['sessions'][scheduled['id']]['status']=='completed'
 report('Scheduled strength completes canonically; substitution and exercise navigation work')
 go('calendar','Training calendar');page.get_by_role('button',name='Week agenda',exact=True).click()
 assert page.locator('.session-row').count()>0
 page.locator('.session-row-actions>button').last.click()
 page.get_by_role('button',name='Duplicate',exact=True).click()
 report('Compact week agenda and contextual duplication work')
 for sport,title in [('running','Running'),('cycling','Cycling'),('swimming','Swimming')]:
  go(sport,title)
  assert page.locator('.library-card').count()>=10
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
  page.locator('.library-card').first.get_by_role('button',name='Explore session').click()
  dlg=page.get_by_role('dialog')
  if sport=='swimming':
   expect(dlg.locator('.swim-set-lanes>div').first).to_be_visible()
   dlg.get_by_role('button',name='Start session',exact=True).click()
   dlg.get_by_role('button',name='Complete set & next',exact=True).click()
   dlg.get_by_role('button',name='Finish workout',exact=True).click()
   assert any(a.get('stepCompletion',{}).get('completed',0)>0 for a in db()['activities'].values())
  else:
   expect(dlg.locator('.profile-y-axis')).to_have_count(1)
   dlg.get_by_role('button',name='Close dialog',exact=True).click()
 report('Sport-specific profiles and explicit swimming set completion work')
 go('analytics','Performance analytics')
 for label in ['Running','Cycling','Swimming','Strength','Overview']:
  page.get_by_role('button',name=label,exact=True).click()
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
 report('All sport analytics tabs render without mobile overflow')
 # Match a real UI-scheduled ride on the demo provider date.
 go('cycling','Cycling')
 page.locator('.library-card').filter(has=page.get_by_role('heading',name='Zone 2 endurance',exact=True)).get_by_role('button',name='Explore session').click()
 dlg=page.get_by_role('dialog')
 from datetime import date,timedelta
 yesterday=(date.today()-timedelta(days=1)).isoformat()
 dlg.get_by_label('Scheduled date',exact=True).fill(yesterday)
 dlg.get_by_role('button',name='Add to calendar',exact=True).click()
 data=db();match=next(s for s in data['sessions'].values() if s['status']=='planned' and s['date']==yesterday and data['workouts'][s['workoutId']]['sport']=='Cycling')
 go('integrations','Integrations');page.get_by_role('button',name='Strava',exact=True).click()
 page.get_by_role('button',name='Demo Import',exact=True).click()
 assert db()['activities']['strava-demo-0']['sessionId']==match['id']
 assert db()['sessions'][match['id']]['status']=='completed'
 count=len(db()['activities']);page.get_by_role('button',name='Demo Import',exact=True).click();assert len(db()['activities'])==count
 report('UI-scheduled ride matches demo activity import, completes once and deduplicates')
 # Real V1 snapshot generated from the original committed implementation, not a V2 object.
 fixture=json.loads((pathlib.Path(__file__).parent/'fixtures/aeron-v1.json').read_text())
 legacy=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
 legacy.add_init_script("if(!localStorage.getItem('aeron-v2-test-initialized')){localStorage.setItem('aeron.database.v1',"+json.dumps(json.dumps(fixture))+ ");localStorage.setItem('aeron-v2-test-initialized','1')}")
 lp=legacy.new_page();lp.goto(BASE+'/#/settings',wait_until='domcontentloaded')
 expect(lp.get_by_role('heading',name='Settings',exact=True)).to_be_visible()
 expect(lp.get_by_text('Your V1 data was migrated to V2.',exact=False)).to_be_visible()
 lp.get_by_label('Preferred name',exact=True).fill('Migrated athlete')
 lp.get_by_role('button',name='Save changes',exact=True).click()
 saved=lp.evaluate("JSON.parse(localStorage.getItem('aeron.database.v2'))")
 assert len(saved['activities'])==len(fixture['activities'])
 assert saved['athlete']['name']=='Migrated athlete'
 assert lp.evaluate("localStorage.getItem('aeron.database.v1.backup')!==null")
 lp.reload();expect(lp.get_by_label('Preferred name',exact=True)).to_have_value('Migrated athlete')
 legacy.close();report('Original V1 snapshot migrates, retains history, creates backup and survives reload')
 for width,height in [(390,844),(1440,1000)]:
  page.set_viewport_size({'width':width,'height':height})
  for route in ['', 'calendar','plans','strength','nutrition','recovery','coach','integrations']:
   page.goto(BASE+'/#/'+route,wait_until='domcontentloaded');expect(page.locator('h1')).to_be_visible()
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(route,width)
 report('Core pages fit mobile and desktop viewports')
 fallback=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
 fallback.add_init_script("const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args)}")
 fp=fallback.new_page();fp.goto(BASE,wait_until='domcontentloaded');expect(fp.locator('h1')).to_be_visible();expect(fp.locator('.scene-fallback').first).to_be_visible();fallback.close()
 report('WebGL fallback keeps dashboard usable')
 assert not errors,errors
 report('No uncaught errors or console errors in V2 journeys')
 browser.close()
