import React, {Component,lazy,Suspense,useEffect,useState,type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import {ContentV2Schema,type ContentV2} from '@astro-static-studio/contracts/content-v2';
import {requestApiJson} from './api-client.js';
import {hydrateOfflineMediaMap} from './offline-media.js';
import './style.css';

void hydrateOfflineMediaMap();

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
 const hadController = Boolean(navigator.serviceWorker.controller);
 let reloading = false;
 navigator.serviceWorker.addEventListener('controllerchange', () => {
  if (hadController && !reloading) {
   reloading = true;
   window.location.reload();
  }
 });
 void navigator.serviceWorker.getRegistrations().then((registrations) => {
  for (const registration of registrations) {
   void registration.update().catch(() => {});
  }
 });
}

const CollectionReviewPrototype=lazy(()=>import('./collection-review-prototype.js'));
const DashboardV2=lazy(()=>import('./dashboard-v2.js'));

async function request(path:string,options:RequestInit={}){
 return requestApiJson('/api/'+path,options);
}

function AppSplash({status,onRetry,isError=false}:{status:string;onRetry?:()=>void;isError?:boolean}){
 return <div className="app-splash" role={isError?'alert':'status'} aria-live="polite"><img className="app-splash-icon" src="/icon.svg" alt="" width="96" height="96"/><h1 className="app-splash-title">astro / studio</h1><p className="app-splash-subtitle">{status}</p>{onRetry?<button type="button" className="app-splash-retry" onClick={onRetry}>تلاش دوباره</button>:<div className="app-splash-bar" aria-hidden="true"><span/></div>}</div>;
}

const OFFLINE_KEY = 'studio-offline-content-v2';

const DEFAULT_FALLBACK_CONTENT: ContentV2 = {
  version: 2,
  site: {
    name: 'سایت من',
    tagline: 'مدیریت محتوای آفلاین با Astro Static Studio',
    email: '',
    phone: '',
    language: 'fa',
    direction: 'rtl',
  },
  pages: [
    {
      id: 'd1000000-0000-4000-8000-000000000001',
      slug: 'home',
      title: 'صفحه اصلی',
      published: true,
      description: { source: 'auto' },
      blocks: [
        {
          type: 'richText',
          placementId: 'b1000000-0000-4000-8000-000000000001',
          document: {
            type: 'document',
            blocks: [
              {
                type: 'paragraph',
                size: 'normal',
                align: 'start',
                children: [
                  {
                    type: 'text',
                    text: 'به استودیوی آفلاین خوش آمدید. شما می‌توانید بدون نیاز به اینترنت محتوا، صفحات و پروژه‌ها را ویرایش و ذخیره کنید.',
                    marks: [],
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  ],
  collections: [],
  items: [],
};

function StudioApp(){
 const [content,setContent]=useState<ContentV2|null>(null);
 const [error,setError]=useState('');
 useEffect(()=>{
  let cancelled=false;
  request('content').then((loaded)=>{
   if(cancelled)return;
   const parsed=ContentV2Schema.safeParse(loaded);
   if(!parsed.success){
    setError('نسخهٔ محتوای سایت پشتیبانی نمی‌شود.');
    return;
   }
   try{localStorage.setItem(OFFLINE_KEY,JSON.stringify(parsed.data))}catch{}
   setContent(parsed.data);
  }).catch(()=>{
   if(cancelled)return;
   const cached=localStorage.getItem(OFFLINE_KEY);
   if(cached){
    try{
     const parsed=ContentV2Schema.parse(JSON.parse(cached));
     setContent(parsed);
     return;
    }catch{}
   }
   // Fallback to local bundled seed content on fresh offline install
   try{localStorage.setItem(OFFLINE_KEY,JSON.stringify(DEFAULT_FALLBACK_CONTENT))}catch{}
   setContent(DEFAULT_FALLBACK_CONTENT);
  });
  return()=>{cancelled=true};
 },[]);
 if(error)return <AppSplash status={error} isError onRetry={()=>location.reload()}/>;
 if(!content)return <AppSplash status="در حال دریافت محتوا…"/>;
 return <Suspense fallback={<AppSplash status="در حال بارگذاری پیشخوان…"/>}><DashboardV2 initialContent={content}/></Suspense>;
}

class StudioErrorBoundary extends Component<{children:ReactNode},{error:string}>{
 state={error:''};
 static getDerivedStateFromError(reason:unknown){
  return {error:reason instanceof Error&&reason.message?reason.message:'خطای غیرمنتظره در بارگذاری استودیو'};
 }
 render(){
  if(this.state.error)return <AppSplash status={this.state.error} isError onRetry={()=>location.reload()}/>;
  return this.props.children;
 }
}

const isCollectionReview = new URLSearchParams(window.location.search).get('review') === 'collections';
createRoot(document.getElementById('root')!).render(
 <StudioErrorBoundary>
  {isCollectionReview ? <Suspense fallback={<AppSplash status="در حال بارگذاری نمونهٔ بازبینی…"/>}><CollectionReviewPrototype/></Suspense> : <StudioApp/>}
 </StudioErrorBoundary>
);
