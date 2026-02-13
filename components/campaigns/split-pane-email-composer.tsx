'use client';

import { useState, useCallback } from 'react';
import {
    ChevronRight,
    ChevronLeft,
    Sparkles,
    AlertCircle,
    CheckCircle,
    TrendingUp,
    Send,
    Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import SmartEmailEditor from '@/components/campaigns/smart-email-editor';
import { proofreadEmail, generateSocialSummaries } from '@/app/actions/ai-proofreader';
import { broadcastPost } from '@/app/actions/broadcast-post';
import { savePost } from '@/app/actions/posts';

interface SplitPaneEmailComposerProps {
    postId?: string;
    initialContent?: string;
    initialTitle?: string;
    initialHasCta?: boolean;
    initialCtaText?: string;
    initialCtaUrl?: string;
    orgId: string;
    adminId: string;
    onPublish?: (publicationData: any) => void;
}

export default function SplitPaneEmailComposer({
    postId,
    initialContent = '',
    initialTitle = '',
    initialHasCta = false,
    initialCtaText = 'Learn More',
    initialCtaUrl = '',
    orgId,
    adminId,
    onPublish,
}: SplitPaneEmailComposerProps) {
    const [rightPaneOpen, setRightPaneOpen] = useState(true);
    const [emailContent, setEmailContent] = useState(initialContent);
    const [subject, setSubject] = useState(initialTitle);

    // CTA Configuration
    const [hasCta, setHasCta] = useState(initialHasCta);
    const [ctaText, setCtaText] = useState(initialCtaText);
    const [ctaUrl, setCtaUrl] = useState(initialCtaUrl);

    // AI Proofreading
    const [proofreadingLoading, setProofreadingLoading] = useState(false);
    const [proofreadingResult, setProofreadingResult] = useState<any>(null);
    const [proofreadingError, setProofreadingError] = useState<string | null>(null);

    // Social Summaries
    const [socialLoading, setSocialLoading] = useState(false);
    const [socialSummaries, setSocialSummaries] = useState<any[]>([]);
    const [socialError, setSocialError] = useState<string | null>(null);

    // Broadcast
    const [broadcasting, setBroadcasting] = useState(false);
    const [broadcastResult, setBroadcastResult] = useState<any>(null);
    const [broadcastError, setBroadcastError] = useState<any>(null);

    // Post Statistics (if existing post)
    const [postStats] = useState({
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        openRate: 0,
        clickRate: 0,
    });

    // Save draft
    const [savingDraft, setSavingDraft] = useState(false);
    const [saveResult, setSaveResult] = useState<any>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    /**
     * Handle Proofreading
     */
    const handleProofread = useCallback(async () => {
        if (!emailContent.trim()) {
            setProofreadingError('Email content is required');
            return;
        }

        setProofreadingLoading(true);
        setProofreadingError(null);
        setProofreadingResult(null);

        try {
            const result = await proofreadEmail(emailContent, {
                has_cta: hasCta,
                cta_text: ctaText,
                cta_url: ctaUrl,
            });

            if (!result.success) {
                setProofreadingError(result.error?.message || 'Proofreading failed');
            } else {
                setProofreadingResult(result.data);
            }
        } catch (error) {
            setProofreadingError(error instanceof Error ? error.message : 'Error during proofreading');
        } finally {
            setProofreadingLoading(false);
        }
    }, [emailContent, hasCta, ctaText, ctaUrl]);

    /**
     * Handle Social Media Generation
     */
    const handleGenerateSocial = useCallback(async () => {
        if (!emailContent.trim()) {
            setSocialError('Email content is required');
            return;
        }

        setSocialLoading(true);
        setSocialError(null);
        setSocialSummaries([]);

        try {
            const result = await generateSocialSummaries(emailContent, subject);

            if (!result.success) {
                setSocialError(result.error?.message || 'Failed to generate social posts');
            } else {
                setSocialSummaries(result.data?.summaries || []);
            }
        } catch (error) {
            setSocialError(error instanceof Error ? error.message : 'Error generating social content');
        } finally {
            setSocialLoading(false);
        }
    }, [emailContent, subject]);

    /**
     * Save Draft
     */
    const handleSaveDraft = useCallback(async () => {
        setSavingDraft(true);
        setSaveError(null);
        setSaveResult(null);


        try {
            const result = await savePost({
                title: subject,
                content_body: emailContent,
                has_cta: hasCta,
                cta_text: hasCta ? ctaText : undefined,
                cta_url: hasCta ? ctaUrl : undefined,
                admin_id: adminId,
                org_id: orgId,
                post_id: postId || undefined,
            });


            if (!result.success) {
                setSaveError(result.error?.message || 'Failed to save draft');
            } else {
                setSaveResult(result.data);
                // Inform parent about saved post id
                if (result.data?.post_id) {
                    onPublish?.(result.data);
                }
            }
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Error saving draft');
        } finally {
            setSavingDraft(false);
        }
    }, [subject, emailContent, hasCta, ctaText, ctaUrl, adminId, orgId, postId, onPublish]);

    /**
     * Handle Broadcast
     */
    const handleBroadcast = useCallback(async () => {
        if (!emailContent.trim() || !postId) {
            setBroadcastError('Please save the post first');
            return;
        }

        // Validate CTA if enabled
        if (hasCta && (!ctaText.trim() || !ctaUrl.trim())) {
            setBroadcastError('CTA text and URL are required when CTA is enabled');
            return;
        }

        setBroadcasting(true);
        setBroadcastError(null);
        setBroadcastResult(null);

        try {
            const result = await broadcastPost(postId, adminId, orgId);

            if (!result.success) {
                setBroadcastError(result.error);
            } else {
                setBroadcastResult(result.data);
                onPublish?.(result.data);
            }
        } catch (error) {
            setBroadcastError(
                error instanceof Error ? error.message : 'Error during broadcast'
            );
        } finally {
            setBroadcasting(false);
        }
    }, [emailContent, postId, hasCta, ctaText, ctaUrl, adminId, orgId, onPublish]);

    const scoreColorClass = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-50';
        if (score >= 60) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    return (
        <div className="flex h-screen gap-4 p-4 bg-neutral-50">
            {/* Left Pane: Editor */}
            <div className="flex-1 flex flex-col gap-4">
                <Card className="flex-1 flex flex-col">
                    <CardHeader className="border-b">
                        <CardTitle style={{ color: "#333" }}>Email Composer</CardTitle>
                        <CardDescription>Write your email content with optional CTA button</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
                        <div className="space-y-4 flex-1 flex flex-col">
                            <div>
                                <Label style={{ color: "#333" }} htmlFor="subject">Subject Line</Label>
                                <Input
                                    id="subject"
                                    placeholder="Enter email subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    maxLength={200}
                                    style={{color: "#333"}}
                                />
                            </div>

                            <div className="flex-1 overflow-hidden">
                                <Label style={{ color: "#333" }}>Email Content</Label>
                                <div className="border rounded-lg overflow-hidden h-full">
                                    <SmartEmailEditor
                                        content={emailContent}
                                        onChange={setEmailContent}
                                        placeholder="Start writing your email..."

                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>


                {/* Broadcast Status */}
                {broadcastResult && (
                    <Alert className="border-green-200 bg-green-50" onClick={(e) => {setBroadcastResult(!broadcastResult)}} style={{position: 'absolute', top: "20vh", left: "0"}}>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            {broadcastResult.message} • Sent to {broadcastResult.recipient_count || 'multiple'}{' '}
                            alumni
                        </AlertDescription>
                    </Alert>
                )}

                {broadcastError && (
                    <Alert className="border-red-200 bg-red-50" onClick={(e) => {setBroadcastError(!broadcastError)}}  style={{position: 'absolute', top: "20vh", left: "0"}}>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            {broadcastError.message}
                            {broadcastError.field && ` (Field: ${broadcastError.field})`}
                            {broadcastError.action && <div className="text-sm mt-1">→ {broadcastError.action}</div>}
                        </AlertDescription>
                    </Alert>
                )}
            </div>

            {/* Right Pane Toggle */}
            <Button
                variant="outline"
                size="icon"
                onClick={() => setRightPaneOpen(!rightPaneOpen)}
                className="self-start"
            >
                {rightPaneOpen ? (
                    <ChevronRight className="h-4 w-4" />
                ) : (
                    <ChevronLeft className="h-4 w-4" />
                )}
            </Button>

            {/* Right Pane: Settings & AI */}
            {rightPaneOpen && (
                <div className="w-96 flex flex-col gap-4 overflow-y-auto">
                    <Tabs defaultValue="cta" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="cta">CTA</TabsTrigger>
                            <TabsTrigger value="ai">AI Tools</TabsTrigger>
                            <TabsTrigger value="stats">Stats</TabsTrigger>
                        </TabsList>

                        {/* CTA Settings Tab */}
                        <TabsContent value="cta" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle style={{ color: "#333" }} className="text-lg">Call-to-Action</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="enable-cta"
                                            checked={hasCta}
                                            onChange={(e) => setHasCta(e.target.checked)}
                                            className="h-4 w-4"
                                            style={{ color: "#333" }}
                                        />
                                        <Label style={{ color: "#333" }} htmlFor="enable-cta" className="cursor-pointer flex-1">
                                            Enable CTA Button
                                        </Label>
                                    </div>

                                    {hasCta && (
                                        <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <div>
                                                <Label htmlFor="cta-text">Button Text</Label>
                                                <Input
                                                    id="cta-text"
                                                    placeholder="e.g., Donate Now"
                                                    value={ctaText}
                                                    onChange={(e) => setCtaText(e.target.value)}
                                                    maxLength={50}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="cta-url">Destination URL</Label>
                                                <Input
                                                    id="cta-url"
                                                    type="url"
                                                    placeholder="https://example.com"
                                                    value={ctaUrl}
                                                    onChange={(e) => setCtaUrl(e.target.value)}
                                                />
                                            </div>

                                            {/* CTA Preview */}
                                            <div className="mt-4 p-3 bg-white rounded border">
                                                <p className="text-xs text-neutral-500 mb-2">Preview:</p>
                                                <a
                                                    href={ctaUrl || '#'}
                                                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 cursor-default"
                                                >
                                                    {ctaText || 'Button'}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* AI Tools Tab */}
                        <TabsContent value="ai" className="space-y-4">
                            {/* Proofreader */}
                            <Card>
                                <CardHeader>
                                    <CardTitle style={{ color: "#333" }} className="text-lg flex items-center gap-2">
                                        <Sparkles style={{ color: "#333" }} className="h-4 w-4" />
                                        Proofreader
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button
                                        onClick={handleProofread}
                                        disabled={proofreadingLoading || !emailContent.trim()}
                                        className="w-full"
                                        variant='outline'
                                    >
                                        {proofreadingLoading ? 'Analyzing...' : 'Proofread Email'}
                                    </Button>

                                    {proofreadingError && (
                                        <Alert className="border-red-200 bg-red-50">
                                            <AlertCircle className="h-4 w-4 text-red-600" />
                                            <AlertDescription className="text-red-800 text-sm">
                                                {proofreadingError}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {proofreadingResult && (
                                        <div className="space-y-3">
                                            <div
                                                className={`p-3 rounded-lg text-center ${scoreColorClass(
                                                    proofreadingResult.score
                                                )}`}
                                            >
                                                <p className="text-2xl font-bold">{proofreadingResult.score}</p>
                                                <p className="text-xs">Quality Score</p>
                                            </div>

                                            <p className="text-sm text-neutral-700">{proofreadingResult.summary}</p>

                                            {proofreadingResult.cta_feedback && (
                                                <div className="p-2 bg-blue-50 rounded border border-blue-200 text-sm">
                                                    <p className="font-semibold text-blue-900">CTA Feedback:</p>
                                                    <p className="text-blue-800">{proofreadingResult.cta_feedback}</p>
                                                </div>
                                            )}

                                            {proofreadingResult.suggestions?.length > 0 && (
                                                <div style={{color: "#333"}} className="space-y-2">
                                                    <p className="font-semibold text-sm">Suggestions:</p>
                                                    {proofreadingResult.suggestions.map((s: any, i: number) => (
                                                        <div key={i} className="text-xs bg-neutral-100 p-2 rounded">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="text-xs">
                                                                    {s.category}
                                                                </Badge>
                                                                <Badge
                                                                    variant={
                                                                        s.severity === 'high'
                                                                            ? 'destructive'
                                                                            : s.severity === 'medium'
                                                                                ? 'secondary'
                                                                                : 'outline'
                                                                    }
                                                                >
                                                                    {s.severity}
                                                                </Badge>
                                                            </div>
                                                            <p className="mt-1">{s.suggestion}</p>
                                                            {s.action && <p className="text-neutral-600 mt-1">→ {s.action}</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Social Media Generator */}
                            <Card>
                                <CardHeader>
                                    <CardTitle style={{ color: "#333" }} className="text-lg">Social Summaries</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button
                                        onClick={handleGenerateSocial}
                                        disabled={socialLoading || !emailContent.trim()}
                                        className="w-full"
                                        variant='outline'
                                    >
                                        {socialLoading ? 'Generating...' : 'Generate Social Posts'}
                                    </Button>

                                    {socialError && (
                                        <Alert className="border-red-200 bg-red-50">
                                            <AlertCircle className="h-4 w-4 text-red-600" />
                                            <AlertDescription className="text-red-800 text-sm">
                                                {socialError}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {socialSummaries.length > 0 && (
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {socialSummaries.map((summary: any) => (
                                                <div key={summary.platform} style={{color: "#333"}} className="p-2 bg-neutral-100 rounded text-xs">
                                                    <p className="font-semibold capitalize mb-1">{summary.platform}</p>
                                                    <p className="text-neutral-700">{summary.content}</p>
                                                    {summary.hashtags && (
                                                        <p className="text-blue-600 mt-1">
                                                            {summary.hashtags.join(' ')}
                                                        </p>
                                                    )}
                                                    <p className="text-neutral-500 mt-1">
                                                        {summary.character_count} chars
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Stats Tab */}
                        <TabsContent value="stats" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle style={{color: "#333"}} className="text-lg flex items-center gap-2">
                                        <TrendingUp style={{color: "#333"}} className="h-4 w-4" />
                                        Post Statistics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {postId ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-blue-50 p-3 rounded">
                                                    <p className="text-xs text-neutral-600">Sent</p>
                                                    <p className="text-xl font-bold text-blue-600">{postStats.sent}</p>
                                                </div>
                                                <div className="bg-green-50 p-3 rounded">
                                                    <p className="text-xs text-neutral-600">Delivered</p>
                                                    <p className="text-xl font-bold text-green-600">{postStats.delivered}</p>
                                                </div>
                                                <div className="bg-purple-50 p-3 rounded">
                                                    <p className="text-xs text-neutral-600">Opened</p>
                                                    <p className="text-xl font-bold text-purple-600">
                                                        {postStats.opened} ({postStats.openRate}%)
                                                    </p>
                                                </div>
                                                <div className="bg-orange-50 p-3 rounded">
                                                    <p className="text-xs text-neutral-600">Clicked</p>
                                                    <p className="text-xl font-bold text-orange-600">
                                                        {postStats.clicked} ({postStats.clickRate}%)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-neutral-600">Save and publish to see statistics</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Save Draft Button */}
                            <Button
                                onClick={handleSaveDraft}
                                disabled={savingDraft || !emailContent.trim()}
                                className="w-full mb-2"
                            >
                                {savingDraft ? 'Saving...' : 'Save as Draft'}
                            </Button>

                            {/* Broadcast Button */}
                            <Button
                                onClick={handleBroadcast}
                                disabled={!postId || broadcasting || !emailContent.trim()}
                                className="w-full"
                                variant='outline'
                                size="lg"
                            >
                                <Send className="h-4 w-4 mr-2" />
                                {broadcasting ? 'Broadcasting...' : 'Broadcast to All Alumni'}
                            </Button>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    );
}
