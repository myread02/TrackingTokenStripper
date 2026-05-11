// ==UserScript==
// @name         TrackingTokenStripper
// @version      2.3
// @description  Remove annoying tracking tokens from URL parameters
// @license      MIT
// @homepage     https://github.com/myread02/TrackingTokenStripper
// @author       Stevwang
// @contributor  Will Huang (https://github.com/doggy8088/TrackingTokenStripper)
// @match        *://*/*
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const LOCATION_CHANGE_EVENT = 'locationchange';
    const INIT_FLAG = '__trackingTokenStripperInitialized__';
    const FOLLOW_UP_DELAYS = [250, 1000, 2000];
    const AMAZON_DOMAINS = /^www\.amazon\.(com|co\.uk|de|fr|it|es|co\.jp|ca|com\.au|in|com\.mx|com\.br|nl|se|pl|sg|ae|sa|com\.tr|eg|cn)$/i;
    const MAX_REDIRECT_UNWRAP_DEPTH = 5;

    const GLOBAL_PARAMS = [
        'fbclid',
        '_aem_',
        'mibextid',
        'rdid',
        'sfnsn',
        'paipv',
        'eav',
        'extid',
        'utm_id',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        '_ga',
        'utm_campaignid',
        'utm_cid',
        'utm_reader',
        'utm_referrer',
        'utm_name',
        'utm_social',
        'utm_social-type',
        'gclid',
        'igshid',
        '_hsenc',
        '_hsmi',
        'mc_cid',
        'mc_eid',
        'mkt_tok',
        'yclid',
        'msclkid',
        '_openstat',
        'wt.mc_id',
        'wt_mc_id',
        'twclid',
        'ttclid',
        'dclid',
        'gad_source',
        'gad_campaignid',
        'gbraid',
        'wbraid',
        'srsltid',
        'fb_action_ids',
        'fb_action_types',
        'fb_ref',
        'fb_source',
        'igsh',
        'li_fat_id',
        'rdt_cid',
        'vero_id',
        'epik',
        'irclickid',
        'irgwc',
        'wickedid',
        '_kx',
        'oly_anon_id',
        'oly_enc_id',
        'hsa_acc',
        'hsa_ad',
        'hsa_cam',
        'hsa_grp',
        'hsa_kw',
        'hsa_mt',
        'hsa_net',
        'hsa_src',
        'hsa_tgt',
        'hsa_ver',
        'pk_campaign',
        'pk_kwd',
        'pk_keyword',
        'pk_medium',
        'pk_source',
        'af_channel',
        'af_media_source',
        'af_ad',
        'af_adset',
        'af_c_id',
        'af_click_lookback',
        'af_siteid',
        'af_sub1',
        'af_sub2',
        'af_sub3',
        'af_sub4',
        'af_sub5',
        '__tn__',
        'gclsrc',
        'itm_source',
        'itm_medium',
        'itm_campaign',
        'mc',
        'mcd',
        'cvosrc',
        'cr_cc',
        'sc_channel',
        'sc_campaign',
        'sc_geo',
        'trk',
        'sc_publisher',
        'trkCampaign',
        'sc_outcome',
        'sc_country',
        '__hstc',
        '__hssc',
        '__hsfp',
        '_gl',
        'guccounter',
        'guce_referrer',
        'guce_referrer_sig',
    ];

    const REDIRECT_RULES = [
        {
            hostPattern: /^www\.google\.(com|com\.[a-z]{2}|co\.[a-z]{2}|[a-z]{2})$/i,
            path: '/url',
            params: ['url', 'q'],
        },
        {
            hostPattern: /^(www|l|lm)\.facebook\.com$/i,
            path: '/l.php',
            params: ['u'],
        },
        {
            hostPattern: /^l\.instagram\.com$/i,
            path: '/',
            params: ['u'],
        },
        {
            host: 'www.linkedin.com',
            path: '/safety/go',
            params: ['url'],
        },
        {
            host: 'out.reddit.com',
            params: ['url'],
        },
        {
            hostPattern: /(^|\.)safelinks\.protection\.outlook\.com$/i,
            params: ['url'],
        },
    ];

    const DOMAIN_RULES = [
        ['www.facebook.com', 'privacy_mutation_token'],
        ['www.facebook.com', 'acontext'],
        ['www.facebook.com', '__xts__[0]'],
        ['www.facebook.com', 'notif_t'],
        ['www.facebook.com', 'notif_id'],
        ['www.facebook.com', 'notif_ids[0]'],
        ['www.facebook.com', 'notif_ids[1]'],
        ['www.facebook.com', 'notif_ids[2]'],
        ['www.facebook.com', 'notif_ids[3]'],
        ['www.facebook.com', 'ref=notif'],
        ['www.facebook.com', 'ref=watch_permalink'],
        ['www.facebook.com', '_rdc'],
        ['www.facebook.com', '_rdr'],
        ['www.facebook.com', 'hc_ref'],
        ['www.facebook.com', 'hc_location'],
        ['www.facebook.com', 'multi_permalinks'],
        ['www.facebook.com', 'comment_id'],
        ['www.facebook.com', 'reply_comment_id'],
        ['www.facebook.com', 'locale'],
        ['www.facebook.com', 'wtsid'],
        ['www.dropbox.com', '_ad'],
        ['www.dropbox.com', '_camp'],
        ['www.dropbox.com', '_tk'],
        ['youtu.be', 'si'],
        ['www.youtube.com', 'si'],
        ['devblogs.microsoft.com', 'utm_issue'],
        ['devblogs.microsoft.com', 'utm_position'],
        ['devblogs.microsoft.com', 'utm_topic'],
        ['devblogs.microsoft.com', 'utm_section'],
        ['devblogs.microsoft.com', 'utm_cta'],
        ['devblogs.microsoft.com', 'utm_description'],
        ['devblogs.microsoft.com', 'ocid'],
        ['learn.microsoft.com', 'ocid'],
        ['learn.microsoft.com', 'redirectedfrom'],
        ['azure.microsoft.com', 'OCID'],
        ['azure.microsoft.com', 'ef_id'],
        ['www.msn.com', 'ocid'],
        ['www.msn.com', 'cvid'],
        ['www.msn.com', 'pc'],
        ['www.msn.com', 'id'],
        ['www.msn.com', 'li'],
        ['www.msn.com', 'fullscreen'],
        ['www.bing.com', 'cvid'],
        ['www.bing.com', 'form'],
        ['www.bing.com', 'toWww'],
        ['www.bing.com', 'redig'],
        ['www.bing.com', 'filters'],
        ['www.bing.com', 'qs'],
        ['www.bing.com', 'sk'],
        ['www.bing.com', 'sp'],
        ['www.bing.com', 'pq'],
        ['www.bing.com', 'sc'],
        ['www.bing.com', 'ghsh'],
        ['www.bing.com', 'ghacc'],
        ['www.bing.com', 'ghpl'],
        ['www.bing.com', 'lq'],
        ['www.bing.com', 'PC'],
        ['www.bing.com', 'FORM'],
        ['today.line.me', 'utm_source'],
        ['today.line.me', 'utm_medium'],
        ['today.line.me', 'utm_campaign'],
        ['today.line.me', 'utm_term'],
        ['today.line.me', 'utm_content'],
        ['today.line.me', 'ref'],
        ['today.line.me', 'share_id'],
        ['today.line.me', 'oaId'],
        ['today.line.me', 'oapHash'],
        ['today.line.me', 'oapContentOrder'],
        ['www.bilibili.com', 'share_source'],
        ['www.bilibili.com', 'share_medium'],
        ['www.threads.com', 'xmt'],
        ['www.threads.com', 'slof'],
        ['x.com', 's'],
        ['x.com', 't'],
        ['twitter.com', 's'],
        ['twitter.com', 't'],
        ['shopee.tw', 'af_channel'],
        ['shopee.tw', 'af_click_lookback'],
        ['shopee.tw', 'af_siteid'],
        ['shopee.tw', 'af_sub_siteid'],
        ['shopee.tw', 'af_viewthrough_lookback'],
        ['shopee.tw', 'c'],
        ['shopee.tw', 'is_from_login'],
        ['shopee.tw', 'pid'],
        ['shopee.tw', 'smtt'],
        ['shopee.tw', 'sp_atk'],
        ['24h.pchome.com.tw', 'gad_source'],
        ['24h.pchome.com.tw', 'mod'],
        ['24h.pchome.com.tw', 'area'],
        ['shopping.pchome.com.tw', 'gad_source'],
        ['shopping.pchome.com.tw', 'mod'],
        ['shopping.pchome.com.tw', 'area'],
        ['udn.com', 'from'],
        ['udn.com', 'ch'],
        ['www.ettoday.net', 'from'],
        ['www.ettoday.net', 'eression_id'],
        ['www.ettoday.net', 'redirect'],
        ['news.ltn.com.tw', 'from'],
        ['www.ltn.com.tw', 'from'],
        ['www.dcard.tw', 'cid'],
        ['www.momoshop.com.tw', 'osm'],
        ['www.momoshop.com.tw', 'gad_source'],
        ['www.momoshop.com.tw', 'gad_campaignid'],
        ['www.momoshop.com.tw', 'gbraid'],
    ];

    const AMAZON_PARAMS = [
        'tag',
        'linkCode',
        'linkId',
        'ref',
        'ref_',
        'psc',
        'pd_rd_i',
        'pd_rd_r',
        'pd_rd_w',
        'pd_rd_wg',
        'pf_rd_i',
        'pf_rd_m',
        'pf_rd_p',
        'pf_rd_r',
        'pf_rd_s',
        'pf_rd_t',
        'qid',
        'sr',
        'keywords',
        'crid',
        'sprefix',
        'spIA',
        'th',
        'smid',
        'dib',
        'dib_tag',
    ];

    function isAmazonHost(hostname) {
        return AMAZON_DOMAINS.test(hostname);
    }

    function matchesRedirectRule(parsedUrl, rule) {
        const hostname = parsedUrl.hostname.toLowerCase();

        if (rule.host && hostname !== rule.host.toLowerCase()) {
            return false;
        }

        if (rule.hostPattern && !rule.hostPattern.test(hostname)) {
            return false;
        }

        if (rule.path && parsedUrl.pathname !== rule.path) {
            return false;
        }

        return true;
    }

    function toSafeRedirectTarget(value) {
        if (!value) {
            return null;
        }

        let targetUrl;
        try {
            targetUrl = new URL(value);
        } catch (error) {
            return null;
        }

        if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
            return null;
        }

        return targetUrl.toString();
    }

    function getSafeRedirectTarget(parsedUrl) {
        for (const rule of REDIRECT_RULES) {
            if (!matchesRedirectRule(parsedUrl, rule)) {
                continue;
            }

            for (const param of rule.params) {
                const target = toSafeRedirectTarget(parsedUrl.searchParams.get(param));
                if (target && target !== parsedUrl.toString()) {
                    return target;
                }
            }
        }

        return null;
    }

    function createSanitizer(parsedUrl) {
        const sanitizer = {
            remove(name, value) {
                if (!parsedUrl.searchParams.has(name)) {
                    return sanitizer;
                }

                if (value === undefined || parsedUrl.searchParams.get(name) === value) {
                    parsedUrl.searchParams.delete(name);
                }

                return sanitizer;
            },
            removeByDomain(domain, rule) {
                if (parsedUrl.hostname.toLowerCase() !== domain.toLowerCase()) {
                    return sanitizer;
                }

                const separatorIndex = rule.indexOf('=');
                if (separatorIndex >= 0) {
                    return sanitizer.remove(
                        rule.slice(0, separatorIndex),
                        rule.slice(separatorIndex + 1)
                    );
                }

                return sanitizer.remove(rule);
            },
            removeByAmazon(name) {
                if (isAmazonHost(parsedUrl.hostname)) {
                    sanitizer.remove(name);
                }
                return sanitizer;
            },
            cleanAmazonPath() {
                if (!isAmazonHost(parsedUrl.hostname)) {
                    return sanitizer;
                }

                const dpMatch = parsedUrl.pathname.match(/\/dp\/([A-Z0-9]{10})/i);
                const gpMatch = parsedUrl.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/i);

                if (dpMatch) {
                    parsedUrl.pathname = '/dp/' + dpMatch[1];
                } else if (gpMatch) {
                    parsedUrl.pathname = '/dp/' + gpMatch[1];
                }

                parsedUrl.search = '';
                return sanitizer;
            },
            toString() {
                return parsedUrl.toString();
            },
        };

        return sanitizer;
    }

    function sanitizeUrl(url, redirectDepth) {
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch (error) {
            return url;
        }

        if ((redirectDepth || 0) < MAX_REDIRECT_UNWRAP_DEPTH) {
            const redirectTarget = getSafeRedirectTarget(parsedUrl);
            if (redirectTarget) {
                return sanitizeUrl(redirectTarget, (redirectDepth || 0) + 1);
            }
        }

        const sanitizer = createSanitizer(parsedUrl);

        for (const name of GLOBAL_PARAMS) {
            sanitizer.remove(name);
        }

        for (const [domain, rule] of DOMAIN_RULES) {
            sanitizer.removeByDomain(domain, rule);
        }

        for (const name of AMAZON_PARAMS) {
            sanitizer.removeByAmazon(name);
        }

        sanitizer.cleanAmazonPath();
        return sanitizer.toString();
    }

    function shouldSanitizeUrl(url) {
        return sanitizeUrl(url) !== url;
    }

    function installInBrowser() {
        if (typeof window === 'undefined' || typeof history === 'undefined' || window[INIT_FLAG]) {
            return;
        }

        window[INIT_FLAG] = true;

        const originalReplaceState = history.replaceState;
        const originalPushState = history.pushState;
        const pendingTimers = new Set();

        function dispatchLocationChange() {
            window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
        }

        function patchHistoryMethod(methodName, originalMethod) {
            history[methodName] = function patchedHistoryMethod() {
                const result = originalMethod.apply(this, arguments);
                dispatchLocationChange();
                return result;
            };
        }

        function clearPendingTimers() {
            for (const timerId of pendingTimers) {
                clearTimeout(timerId);
            }
            pendingTimers.clear();
        }

        function executeActions() {
            const sanitizedUrl = sanitizeUrl(location.href);
            if (sanitizedUrl !== location.href) {
                originalReplaceState.call(history, history.state, document.title, sanitizedUrl);
            }
        }

        function scheduleActions() {
            clearPendingTimers();
            executeActions();

            for (const delay of FOLLOW_UP_DELAYS) {
                const timerId = window.setTimeout(() => {
                    pendingTimers.delete(timerId);
                    executeActions();
                }, delay);

                pendingTimers.add(timerId);
            }
        }

        patchHistoryMethod('replaceState', originalReplaceState);
        patchHistoryMethod('pushState', originalPushState);

        window.addEventListener('popstate', dispatchLocationChange);
        window.addEventListener(LOCATION_CHANGE_EVENT, scheduleActions);

        scheduleActions();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            sanitizeUrl,
            shouldSanitizeUrl,
        };
    }

    installInBrowser();
})();
