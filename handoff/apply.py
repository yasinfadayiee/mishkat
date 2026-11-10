import json,sys,hashlib,re
S=json.load(open(sys.argv[1]))
dump=lambda o,f: open(f,'w').write(json.dumps(o,ensure_ascii=False,separators=(',',':')))
# round-trip check
for f in ['books/Nahj-al-Balagha-Radi.json','books/ghurar.json','books/topics.json']:
    raw=open(f).read(); assert json.dumps(json.loads(raw),ensure_ascii=False,separators=(',',':'))==raw.rstrip('\n'), f
changed=[]  # (book,sec,ch,i,item)
n=json.load(open('books/Nahj-al-Balagha-Radi.json'))
idx={it['i']:(si,ci,it) for si,s in enumerate(n['sections']) for ci,c in enumerate(s['chapters']) for it in c['items']}
for k,v in S['nahj'].items():
    si,ci,it=idx[int(k)]; it.update(v); changed.append(('Nahj-al-Balagha-Radi',si,ci,it))
g=json.load(open('books/ghurar.json'))
for it,v in zip(g['sections'][0]['chapters'][0]['items'],S['ghurar']):
    it.update(v); changed.append(('ghurar',0,0,it))
t=json.load(open('books/topics.json'))
keys={(b,s,c,it['i']) for b,s,c,it in changed}
for k in t: t[k]=[e for e in t[k] if tuple(e[:4]) not in keys]
for b,s,c,it in changed:
    for tg in it.get('tg',[]):
        t.setdefault(tg,[]).append([b,s,c,it['i'],it['fa'],it.get('sm','')])
dump(n,'books/Nahj-al-Balagha-Radi.json'); dump(g,'books/ghurar.json'); dump(t,'books/topics.json')
sw=open('sw.js').read(); h=hashlib.sha1(b''.join(open(f,'rb').read() for f in ['books/Nahj-al-Balagha-Radi.json','books/ghurar.json','books/topics.json'])).hexdigest()[:10]
open('sw.js','w').write(re.sub(r"mishkat-[0-9a-f]+","mishkat-"+h,sw,count=1)); print('ok',len(changed),h)
